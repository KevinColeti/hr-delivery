import { Injectable, signal } from '@angular/core';
import { OrderTrackingResponse, OrdersApiService } from './orders-api.service';
import { Subscription, interval } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
/**
 * Estado de dominio de acompanhamento de pedido.
 *
 * Responsabilidades:
 * - manter ultimo pedido consultado entre navegacoes;
 * - centralizar fluxo de consulta e tratamento de erro;
 * - expor estado pronto para telas `/acompanhar` e `/pedido/:id`.
 */
export class TrackingStateService {
  private readonly lastOrderStorageKey = 'hrnachapa_last_order_id_v1';
  private readonly trackingOrderIdSignal = signal('');
  private readonly trackingLoadingSignal = signal(false);
  private readonly trackingErrorSignal = signal('');
  private readonly trackingDataSignal = signal<OrderTrackingResponse | null>(null);
  private readonly ownedOrderIdSignal = signal<number | null>(this.loadOwnedOrderIdFromStorage());
  private autoRefreshSubscription: Subscription | null = null;
  private autoRefreshOrderId: number | null = null;

  readonly trackingOrderId = this.trackingOrderIdSignal.asReadonly();
  readonly trackingLoading = this.trackingLoadingSignal.asReadonly();
  readonly trackingError = this.trackingErrorSignal.asReadonly();
  readonly trackingData = this.trackingDataSignal.asReadonly();
  readonly ownedOrderId = this.ownedOrderIdSignal.asReadonly();

  /**
   * Injeta adaptador de pedidos para consulta publica de tracking.
   */
  constructor(private readonly ordersApiService: OrdersApiService) {}

  /**
   * Registra pedido como pertencente ao dispositivo atual.
   *
   * Motivo:
   * sem autenticacao de cliente nesta fase, o vinculo por dispositivo
   * evita expor busca aberta por numero de pedido.
   */
  setOwnedOrderId(orderId: number) {
    this.ownedOrderIdSignal.set(orderId);
    this.trackingOrderIdSignal.set(String(orderId));
    localStorage.setItem(this.lastOrderStorageKey, String(orderId));
  }

  /**
   * Retorna identificador do pedido salvo no dispositivo, quando existir.
   */
  getOwnedOrderId() {
    return this.ownedOrderIdSignal();
  }

  /**
   * Informa se o pedido solicitado pertence ao dispositivo atual.
   */
  isOwnedOrder(orderId: number) {
    return this.ownedOrderIdSignal() === orderId;
  }

  /**
   * Define estado quando nao existe pedido ativo para o cliente.
   */
  setNoActiveOrderState() {
    this.trackingLoadingSignal.set(false);
    this.trackingDataSignal.set(null);
    this.trackingErrorSignal.set('Nao existe pedido ativo neste dispositivo.');
  }

  /**
   * Define estado de acesso negado para pedido que nao pertence ao dispositivo.
   */
  setForbiddenOrderState() {
    this.trackingLoadingSignal.set(false);
    this.trackingDataSignal.set(null);
    this.trackingErrorSignal.set('Voce nao pode acompanhar este pedido neste dispositivo.');
  }

  /**
   * Executa consulta publica de tracking por identificador numerico.
   */
  loadTrackingByOrderId(orderId: number) {
    this.trackingLoadingSignal.set(true);
    this.trackingErrorSignal.set('');
    this.trackingDataSignal.set(null);
    this.trackingOrderIdSignal.set(String(orderId));

    this.ordersApiService.getOrderTracking(orderId).subscribe({
      next: (response) => {
        this.trackingLoadingSignal.set(false);
        this.trackingDataSignal.set(response);
      },
      error: (error) => {
        this.trackingLoadingSignal.set(false);
        this.trackingDataSignal.set(null);
        this.trackingErrorSignal.set(
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Nao foi possivel consultar o pedido.',
        );
      },
    });
  }

  /**
   * Inicia atualizacao automatica do tracking em intervalo fixo.
   *
   * Motivo:
   * como o cliente nao consome SSE autenticado nesta etapa, polling curto
   * garante feedback quase em tempo real sem exigir acao manual.
   */
  startAutoRefresh(orderId: number, intervalMs = 3000) {
    if (this.autoRefreshOrderId === orderId && this.autoRefreshSubscription) {
      return;
    }

    this.stopAutoRefresh();
    this.autoRefreshOrderId = orderId;
    this.loadTrackingByOrderId(orderId);
    this.autoRefreshSubscription = interval(intervalMs).subscribe(() => {
      this.refreshTrackingByOrderId(orderId);
    });
  }

  /**
   * Interrompe atualizacao automatica do tracking.
   */
  stopAutoRefresh() {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = null;
    }

    this.autoRefreshOrderId = null;
  }

  /**
   * Executa refresh silencioso sem limpar timeline atual.
   */
  private refreshTrackingByOrderId(orderId: number) {
    this.trackingOrderIdSignal.set(String(orderId));
    this.trackingErrorSignal.set('');
    this.ordersApiService.getOrderTracking(orderId).subscribe({
      next: (response) => {
        this.trackingLoadingSignal.set(false);
        this.trackingDataSignal.set(response);
      },
      error: (error) => {
        this.trackingLoadingSignal.set(false);
        this.trackingErrorSignal.set(
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Nao foi possivel atualizar o status do pedido.',
        );
      },
    });
  }

  /**
   * Carrega id do ultimo pedido salvo no navegador.
   */
  private loadOwnedOrderIdFromStorage() {
    const rawOrderId = localStorage.getItem(this.lastOrderStorageKey);
    const parsedOrderId = Number(rawOrderId);
    return Number.isInteger(parsedOrderId) && parsedOrderId > 0 ? parsedOrderId : null;
  }
}
