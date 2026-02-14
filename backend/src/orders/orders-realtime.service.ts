import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { OrderStatus } from '../entities/order.entity';

export interface OrdersRealtimeEvent {
  id: number;
  type: 'order_created' | 'order_status_changed';
  orderId: number;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  createdAt: string;
}

@Injectable()
/**
 * Publica eventos de pedidos para consumo em tempo real via SSE.
 *
 * Escolha de arquitetura:
 * - para fase atual, o barramento em memoria reduz complexidade operacional;
 * - quando houver multi-instancia, pode ser trocado por broker (Redis/NATS)
 *   mantendo o mesmo contrato de evento.
 */
export class OrdersRealtimeService {
  private readonly events$ = new Subject<OrdersRealtimeEvent>();
  private eventSequence = 0;

  /**
   * Stream geral de eventos de pedidos.
   */
  getOrdersStream(): Observable<MessageEvent> {
    return this.events$.pipe(
      map((event) => ({
        id: String(event.id),
        type: event.type,
        data: event,
      })),
    );
  }

  /**
   * Stream da cozinha com eventos operacionais relevantes.
   */
  getKitchenStream(): Observable<MessageEvent> {
    const kitchenStatuses = new Set<OrderStatus>([
      OrderStatus.CONFIRMED,
      OrderStatus.IN_PREPARATION,
      OrderStatus.READY,
    ]);

    return this.events$.pipe(
      filter((event) => kitchenStatuses.has(event.status)),
      map((event) => ({
        id: String(event.id),
        type: event.type,
        data: event,
      })),
    );
  }

  /**
   * Publica evento com id incremental para ordering no cliente.
   */
  publish(event: Omit<OrdersRealtimeEvent, 'id' | 'createdAt'>) {
    this.eventSequence += 1;

    this.events$.next({
      id: this.eventSequence,
      createdAt: new Date().toISOString(),
      ...event,
    });
  }
}
