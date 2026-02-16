import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminOrdersRealtimeService } from '../../services/admin-orders-realtime.service';
import { AdminOrder, AdminOrderStatus, AdminOrdersService } from '../../services/admin-orders.service';

@Component({
  selector: 'app-admin-kitchen',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-kitchen.html',
  styleUrl: './admin-kitchen.css',
})
/**
 * Board operacional da cozinha.
 *
 * Responsabilidades:
 * - listar pedidos em preparo no recorte da cozinha;
 * - permitir acoes operacionais rapidas (`in_preparation` e `ready`);
 * - manter atualizacao automatica para reduzir atraso de operacao.
 */
export class AdminKitchenComponent implements OnInit, OnDestroy {
  kitchenOrders: AdminOrder[] = [];
  includeReady = true;
  boardLimit = 100;
  isLoadingBoard = false;
  boardErrorMessage = '';
  actionErrorMessage = '';
  actionOrderIdInProgress: number | null = null;
  private streamDisconnect: (() => void) | null = null;

  /**
   * Injeta adaptador HTTP de pedidos para a tela da cozinha.
   */
  constructor(
    private readonly adminOrdersService: AdminOrdersService,
    private readonly adminOrdersRealtimeService: AdminOrdersRealtimeService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  /**
   * Carrega board inicial e inicia stream em tempo real da cozinha.
   */
  ngOnInit() {
    this.loadKitchenBoard();
    this.startRealtimeUpdates();
  }

  /**
   * Finaliza assinatura de stream ao sair da tela.
   */
  ngOnDestroy() {
    this.stopRealtimeUpdates();
  }

  /**
   * Atualiza board da cozinha conforme filtros correntes.
   */
  loadKitchenBoard(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) {
      this.isLoadingBoard = true;
      this.boardErrorMessage = '';
    }

    this.adminOrdersService
      .listKitchenBoard({ includeReady: this.includeReady, limit: this.boardLimit })
      .subscribe({
        next: (orders) => {
          this.isLoadingBoard = false;
          this.kitchenOrders = orders;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoadingBoard = false;
          if (!silent) {
            this.boardErrorMessage =
              error?.error?.message && typeof error.error.message === 'string'
                ? error.error.message
                : 'Nao foi possivel carregar o board da cozinha.';
          }
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Recarrega board quando filtro de exibicao muda.
   */
  onIncludeReadyChanged() {
    this.loadKitchenBoard();
  }

  /**
   * Informa se pedido pode ir de `confirmed` para `in_preparation`.
   */
  canStartPreparation(order: AdminOrder) {
    return order.status === 'confirmed';
  }

  /**
   * Informa se pedido pode ser marcado como `ready`.
   */
  canMarkReady(order: AdminOrder) {
    return order.status === 'in_preparation';
  }

  /**
   * Executa acao de iniciar preparo para um pedido confirmado.
   */
  startPreparation(order: AdminOrder) {
    if (!this.canStartPreparation(order)) {
      return;
    }

    this.actionOrderIdInProgress = order.id;
    this.actionErrorMessage = '';

    this.adminOrdersService
      .updateOrderStatus(order.id, { status: 'in_preparation' })
      .subscribe({
      next: () => {
        this.actionOrderIdInProgress = null;
        this.loadKitchenBoard();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.actionOrderIdInProgress = null;
        this.actionErrorMessage =
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Falha ao iniciar preparo do pedido.';
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Executa acao rapida da cozinha para marcar pedido como pronto.
   */
  markReady(order: AdminOrder) {
    if (!this.canMarkReady(order)) {
      return;
    }

    this.actionOrderIdInProgress = order.id;
    this.actionErrorMessage = '';

    this.adminOrdersService.markOrderReady(order.id).subscribe({
      next: () => {
        this.actionOrderIdInProgress = null;
        this.loadKitchenBoard();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.actionOrderIdInProgress = null;
        this.actionErrorMessage =
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Falha ao marcar pedido como pronto.';
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Traduz status para rotulo legivel no monitor da cozinha.
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
   * Resolve classes visuais por status para cards da cozinha.
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
   * Converte valores de resposta numerica para numero seguro no template.
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
   * Inicia assinatura do stream de cozinha para refresh imediato por evento.
   */
  private startRealtimeUpdates() {
    this.stopRealtimeUpdates();
    this.streamDisconnect = this.adminOrdersRealtimeService.connectKitchenStream(() => {
      if (this.actionOrderIdInProgress !== null) {
        return;
      }

      // Atualizamos de forma silenciosa para evitar "piscar" visual
      // em eventos frequentes do stream operacional.
      this.loadKitchenBoard({ silent: true });
    });
  }

  /**
   * Encerra assinatura do stream de cozinha da pagina.
   */
  private stopRealtimeUpdates() {
    if (!this.streamDisconnect) {
      return;
    }

    this.streamDisconnect();
    this.streamDisconnect = null;
  }
}
