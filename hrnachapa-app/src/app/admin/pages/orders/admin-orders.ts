import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { AdminOrdersRealtimeService } from '../../services/admin-orders-realtime.service';
import {
  AdminOrder,
  AdminOrderStatus,
  AdminOrderStatusHistoryEntry,
  AdminOrdersService,
  UpdateAdminOrderStatusPayload,
} from '../../services/admin-orders.service';

@Component({
  selector: 'app-admin-orders',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
/**
 * Modulo de pedidos do painel administrativo.
 *
 * Responsabilidades:
 * - listar pedidos operacionais com filtro por status;
 * - exibir detalhe completo de pedido e historico de status;
 * - executar transicoes de status permitidas para o fluxo administrativo.
 */
export class AdminOrdersComponent implements OnInit, OnDestroy {
  readonly defaultCancellationCustomerMessage =
    'Tivemos um problema com o seu pedido, e precisamos cancelar.';

  readonly statusFilterOptions: Array<AdminOrderStatus | 'all'> = [
    'all',
    'new',
    'confirmed',
    'in_preparation',
    'ready',
    'out_for_delivery',
    'delivered',
    'canceled',
  ];

  orders: AdminOrder[] = [];
  selectedOrder: AdminOrder | null = null;
  selectedOrderId: number | null = null;
  statusHistory: AdminOrderStatusHistoryEntry[] = [];
  statusFilter: AdminOrderStatus | 'all' = 'all';

  isLoadingOrders = false;
  isLoadingOrderDetails = false;
  isUpdatingStatus = false;
  isCancellationDialogOpen = false;
  cancellationCustomerMessage = '';
  cancellationInternalNote = '';

  listErrorMessage = '';
  detailErrorMessage = '';
  statusActionErrorMessage = '';
  private refreshSubscription: Subscription | null = null;
  private streamDisconnect: (() => void) | null = null;

  /**
   * Injeta adaptador de pedidos do admin.
   */
  constructor(
    private readonly adminOrdersService: AdminOrdersService,
    private readonly adminOrdersRealtimeService: AdminOrdersRealtimeService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  /**
   * Inicializa lista de pedidos e refresh automatico de acompanhamento.
   */
  ngOnInit() {
    this.loadOrders(true);
    this.startRealtimeUpdates();
    this.startAutoRefresh();
  }

  /**
   * Libera assinatura de auto refresh ao destruir pagina.
   */
  ngOnDestroy() {
    this.stopRealtimeUpdates();
    this.stopAutoRefresh();
  }

  /**
   * Retorna pedidos da lista conforme filtro de status selecionado.
   */
  get filteredOrders() {
    if (this.statusFilter === 'all') {
      return this.orders;
    }

    return this.orders.filter((order) => order.status === this.statusFilter);
  }

  /**
   * Carrega lista de pedidos preservando selecao atual quando possivel.
   */
  loadOrders(preserveSelection: boolean) {
    this.isLoadingOrders = true;
    this.listErrorMessage = '';

    this.adminOrdersService.listOrders().subscribe({
      next: (orders) => {
        this.isLoadingOrders = false;
        this.orders = orders;
        this.cdr.detectChanges();

        if (!preserveSelection || this.selectedOrderId === null) {
          return;
        }

        const selectedFromList =
          this.orders.find((order) => order.id === this.selectedOrderId) ?? null;
        this.selectedOrder = selectedFromList;

        if (!selectedFromList) {
          this.selectedOrderId = null;
          this.statusHistory = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingOrders = false;
        this.listErrorMessage =
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Nao foi possivel carregar os pedidos.';
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Seleciona um pedido da lista e carrega seu detalhe completo.
   */
  selectOrder(orderId: number) {
    this.selectedOrderId = orderId;
    this.closeCancellationDialog();
    this.loadSelectedOrderDetails(orderId);
  }

  /**
   * Retorna transicoes de status permitidas para o pedido selecionado.
   */
  getSelectedOrderTransitions() {
    if (!this.selectedOrder) {
      return [];
    }

    const transitions: Record<AdminOrderStatus, AdminOrderStatus[]> = {
      new: ['confirmed', 'canceled'],
      confirmed: ['in_preparation', 'canceled'],
      in_preparation: ['ready', 'canceled'],
      ready: ['out_for_delivery', 'canceled'],
      out_for_delivery: ['delivered', 'canceled'],
      delivered: [],
      canceled: [],
    };

    return transitions[this.selectedOrder.status];
  }

  /**
   * Executa transicao de status para o pedido selecionado.
   */
  updateSelectedOrderStatus(
    nextStatus: AdminOrderStatus,
    payload?: UpdateAdminOrderStatusPayload,
  ) {
    if (!this.selectedOrder) {
      return;
    }

    this.isUpdatingStatus = true;
    this.statusActionErrorMessage = '';
    const requestPayload = payload ?? { status: nextStatus };

    this.adminOrdersService.updateOrderStatus(this.selectedOrder.id, requestPayload).subscribe({
      next: (updatedOrder) => {
        this.isUpdatingStatus = false;
        this.selectedOrder = updatedOrder;
        this.selectedOrderId = updatedOrder.id;
        this.closeCancellationDialog();
        this.loadOrders(true);
        this.loadStatusHistory(updatedOrder.id);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isUpdatingStatus = false;
        this.statusActionErrorMessage =
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Falha ao atualizar status do pedido.';
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Abre confirmacao de cancelamento com mensagem padrao para o cliente.
   */
  openCancellationDialog() {
    if (!this.selectedOrder || this.selectedOrder.status === 'canceled') {
      return;
    }

    this.cancellationCustomerMessage = this.defaultCancellationCustomerMessage;
    this.cancellationInternalNote = '';
    this.statusActionErrorMessage = '';
    this.isCancellationDialogOpen = true;
  }

  /**
   * Fecha modal de cancelamento e limpa estado de formulario.
   */
  closeCancellationDialog() {
    this.isCancellationDialogOpen = false;
    this.cancellationCustomerMessage = '';
    this.cancellationInternalNote = '';
  }

  /**
   * Confirma cancelamento com mensagem ao cliente e nota interna.
   *
   * Motivo:
   * enviar os dois campos no mesmo request garante que a operacao fique
   * auditavel e evita cancelamento sem contexto para suporte posterior.
   */
  confirmSelectedOrderCancellation() {
    if (!this.selectedOrder || this.selectedOrder.status === 'canceled') {
      return;
    }

    const payload: UpdateAdminOrderStatusPayload = {
      status: 'canceled',
      cancellationCustomerMessage: this.cancellationCustomerMessage,
      cancellationInternalNote: this.cancellationInternalNote,
    };

    this.updateSelectedOrderStatus('canceled', payload);
  }

  /**
   * Reverte cancelamento para o status anterior do pedido.
   */
  revertSelectedOrderCancellation() {
    if (!this.selectedOrder || this.selectedOrder.status !== 'canceled') {
      return;
    }

    this.isUpdatingStatus = true;
    this.statusActionErrorMessage = '';

    this.adminOrdersService.revertOrderCancellation(this.selectedOrder.id).subscribe({
      next: (updatedOrder) => {
        this.isUpdatingStatus = false;
        this.selectedOrder = updatedOrder;
        this.selectedOrderId = updatedOrder.id;
        this.loadOrders(true);
        this.loadStatusHistory(updatedOrder.id);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isUpdatingStatus = false;
        this.statusActionErrorMessage =
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Falha ao reverter cancelamento do pedido.';
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Traduz status para rotulo legivel no painel.
   */
  getStatusLabel(status: AdminOrderStatus) {
    const labels: Record<AdminOrderStatus, string> = {
      new: 'Novo',
      confirmed: 'Confirmado',
      in_preparation: 'Em preparo',
      ready: 'Pronto',
      out_for_delivery: 'Saiu para entrega',
      delivered: 'Entregue',
      canceled: 'Cancelado',
    };

    return labels[status];
  }

  /**
   * Resolve classes visuais por status para chips e tags da tela.
   */
  getStatusBadgeClass(status: AdminOrderStatus) {
    const classesByStatus: Record<AdminOrderStatus, string> = {
      new: 'bg-blue-100 text-blue-700 border border-blue-200',
      confirmed: 'bg-amber-100 text-amber-700 border border-amber-200',
      in_preparation: 'bg-orange-100 text-orange-700 border border-orange-200',
      ready: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      out_for_delivery: 'bg-purple-100 text-purple-700 border border-purple-200',
      delivered: 'bg-stone-200 text-stone-700 border border-stone-300',
      canceled: 'bg-red-100 text-red-700 border border-red-200',
    };

    return classesByStatus[status];
  }

  /**
   * Converte valor numerico em string para numero seguro no template.
   */
  toNumber(value: string | number | null | undefined) {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  /**
   * Carrega detalhe completo de pedido e historico de status.
   */
  private loadSelectedOrderDetails(orderId: number) {
    this.isLoadingOrderDetails = true;
    this.detailErrorMessage = '';
    this.statusActionErrorMessage = '';

    this.adminOrdersService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.isLoadingOrderDetails = false;
        this.selectedOrder = order;
        this.loadStatusHistory(orderId);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingOrderDetails = false;
        this.selectedOrder = null;
        this.statusHistory = [];
        this.detailErrorMessage =
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Nao foi possivel carregar o detalhe do pedido.';
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Carrega trilha de auditoria de status do pedido selecionado.
   */
  private loadStatusHistory(orderId: number) {
    this.adminOrdersService.listOrderStatusHistory(orderId).subscribe({
      next: (history) => {
        this.statusHistory = history;
        this.cdr.detectChanges();
      },
      error: () => {
        this.statusHistory = [];
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Inicia refresh automatico da lista para reduzir atraso operacional.
   *
   * Motivo:
   * atualizamos em intervalo curto para manter o backoffice responsivo
   * mesmo antes de integrar consumo direto de stream SSE no frontend.
   */
  private startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshSubscription = interval(4000).subscribe(() => {
      this.loadOrders(true);
      if (this.selectedOrderId !== null) {
        this.loadSelectedOrderDetails(this.selectedOrderId);
      }
    });
  }

  /**
   * Encerra refresh automatico da tela.
   */
  private stopAutoRefresh() {
    if (!this.refreshSubscription) {
      return;
    }

    this.refreshSubscription.unsubscribe();
    this.refreshSubscription = null;
  }

  /**
   * Inicia assinatura de stream de pedidos para atualizar tela por evento.
   */
  private startRealtimeUpdates() {
    this.stopRealtimeUpdates();
    this.streamDisconnect = this.adminOrdersRealtimeService.connectOrdersStream((event) => {
      // Atualizamos a lista inteira para manter consistencia entre filtros
      // e detalhe selecionado quando eventos chegam fora de ordem.
      this.loadOrders(true);
      if (this.selectedOrderId !== null && event.orderId === this.selectedOrderId) {
        this.loadSelectedOrderDetails(this.selectedOrderId);
      }
    });
  }

  /**
   * Encerra assinatura de stream de pedidos da tela.
   */
  private stopRealtimeUpdates() {
    if (!this.streamDisconnect) {
      return;
    }

    this.streamDisconnect();
    this.streamDisconnect = null;
  }
}
