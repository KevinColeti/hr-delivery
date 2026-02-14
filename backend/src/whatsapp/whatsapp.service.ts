import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';
import { Order, OrderStatus } from '../entities/order.entity';

@Injectable()
/**
 * Integracao simples de mensagens WhatsApp via webhook.
 *
 * Contrato de envio:
 * - endpoint configuravel via ENV;
 * - payload generico para facilitar troca de provedor sem mexer no dominio.
 */
export class WhatsAppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: StructuredLoggerService,
  ) {}

  /**
   * Envia mensagem de confirmacao de pedido criado.
   */
  async sendOrderCreated(order: Order) {
    const message = `Pedido #${order.id} recebido com sucesso. Total: R$ ${Number(order.total).toFixed(2)}. Acompanhe as proximas atualizacoes de status.`;
    await this.sendOrderEventMessage(order, 'order_created', message);
  }

  /**
   * Envia mensagem de mudanca de status de pedido.
   */
  async sendOrderStatusUpdated(order: Order) {
    const message = `Pedido #${order.id} atualizado para: ${this.getStatusLabel(order.status)}.`;
    await this.sendOrderEventMessage(order, 'order_status_changed', message);
  }

  /**
   * Envia payload para webhook com timeout e autenticacao opcional.
   */
  private async sendOrderEventMessage(
    order: Order,
    eventType: 'order_created' | 'order_status_changed',
    message: string,
  ) {
    const webhookUrl = this.configService.get<string>('WHATSAPP_WEBHOOK_URL', '');
    const enabled = this.configService.get<string>('WHATSAPP_ENABLED', 'false') === 'true';

    if (!enabled || !webhookUrl) {
      this.logger.info('whatsapp.notification.skipped', {
        orderId: order.id,
        eventType,
        reason: 'disabled_or_missing_webhook',
      });
      return;
    }

    if (!order.client?.phone) {
      this.logger.info('whatsapp.notification.skipped', {
        orderId: order.id,
        eventType,
        reason: 'missing_client_phone',
      });
      return;
    }

    const token = this.configService.get<string>('WHATSAPP_AUTH_TOKEN', '');
    const timeoutMs = Number(this.configService.get<string>('WHATSAPP_TIMEOUT_MS', '5000'));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          channel: 'whatsapp',
          to: order.client.phone,
          message,
          eventType,
          order: {
            id: order.id,
            status: order.status,
            total: order.total,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.error('whatsapp.notification.failed', {
          orderId: order.id,
          eventType,
          statusCode: response.status,
          statusText: response.statusText,
        });
        return;
      }

      this.logger.info('whatsapp.notification.sent', {
        orderId: order.id,
        eventType,
        providerStatusCode: response.status,
      });
    } catch (error) {
      this.logger.error('whatsapp.notification.failed', {
        orderId: order.id,
        eventType,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Traduz status tecnico para texto amigavel.
   */
  private getStatusLabel(status: OrderStatus) {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.NEW]: 'Novo',
      [OrderStatus.CONFIRMED]: 'Confirmado',
      [OrderStatus.IN_PREPARATION]: 'Em preparo',
      [OrderStatus.READY]: 'Pronto',
      [OrderStatus.OUT_FOR_DELIVERY]: 'Saiu para entrega',
      [OrderStatus.DELIVERED]: 'Entregue',
      [OrderStatus.CANCELED]: 'Cancelado',
    };

    return labels[status];
  }
}
