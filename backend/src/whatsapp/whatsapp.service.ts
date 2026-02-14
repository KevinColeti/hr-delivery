import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';
import { Order, OrderStatus } from '../entities/order.entity';
import { WhatsAppNotificationLog } from '../entities/whatsapp-notification-log.entity';

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
    @InjectRepository(WhatsAppNotificationLog)
    private readonly whatsappNotificationLogsRepository: Repository<WhatsAppNotificationLog>,
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
    const maxAttempts = Math.max(
      1,
      Number(this.configService.get<string>('WHATSAPP_MAX_ATTEMPTS', '2')),
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
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
          await this.recordDeliveryAttempt({
            orderId: order.id,
            eventType,
            toPhone: order.client.phone,
            message,
            attempt,
            success: false,
            providerStatusCode: response.status,
            errorMessage: `${response.status} ${response.statusText}`,
          });

          const shouldRetry = attempt < maxAttempts;
          this.logger.error('whatsapp.notification.failed', {
            orderId: order.id,
            eventType,
            attempt,
            maxAttempts,
            statusCode: response.status,
            statusText: response.statusText,
            retryScheduled: shouldRetry,
          });

          if (!shouldRetry) {
            return;
          }
          continue;
        }

        await this.recordDeliveryAttempt({
          orderId: order.id,
          eventType,
          toPhone: order.client.phone,
          message,
          attempt,
          success: true,
          providerStatusCode: response.status,
          errorMessage: null,
        });

        this.logger.info('whatsapp.notification.sent', {
          orderId: order.id,
          eventType,
          attempt,
          providerStatusCode: response.status,
        });
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.recordDeliveryAttempt({
          orderId: order.id,
          eventType,
          toPhone: order.client.phone,
          message,
          attempt,
          success: false,
          providerStatusCode: null,
          errorMessage,
        });

        const shouldRetry = attempt < maxAttempts;
        this.logger.error('whatsapp.notification.failed', {
          orderId: order.id,
          eventType,
          attempt,
          maxAttempts,
          errorMessage,
          retryScheduled: shouldRetry,
        });

        if (!shouldRetry) {
          return;
        }
      } finally {
        clearTimeout(timeout);
      }
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

  /**
   * Persiste trilha de envio para auditoria operacional.
   */
  private async recordDeliveryAttempt(params: {
    orderId: number | null;
    eventType: 'order_created' | 'order_status_changed';
    toPhone: string | null;
    message: string;
    attempt: number;
    success: boolean;
    providerStatusCode: number | null;
    errorMessage: string | null;
  }) {
    const log = this.whatsappNotificationLogsRepository.create({
      orderId: params.orderId,
      channel: 'whatsapp',
      eventType: params.eventType,
      toPhone: params.toPhone,
      message: params.message,
      attempt: params.attempt,
      success: params.success,
      providerStatusCode: params.providerStatusCode,
      errorMessage: params.errorMessage,
    });

    await this.whatsappNotificationLogsRepository.save(log);
  }
}
