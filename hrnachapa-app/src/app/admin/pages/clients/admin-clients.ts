import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminClientSummary, AdminClientsService } from '../../services/admin-clients.service';
import { AdminOrder, AdminOrderStatus } from '../../services/admin-orders.service';

@Component({
  selector: 'app-admin-clients',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-clients.html',
  styleUrl: './admin-clients.css',
})
/**
 * Modulo de clientes do painel administrativo.
 *
 * Responsabilidades:
 * - listar clientes com filtros de operacao;
 * - exibir resumo consolidado de cliente selecionado;
 * - consultar historico de pedidos associado ao cliente.
 */
export class AdminClientsComponent implements OnInit {
  clients: AdminClientSummary[] = [];
  selectedClient: AdminClientSummary | null = null;
  selectedClientId: number | null = null;
  selectedClientOrders: AdminOrder[] = [];

  searchTerm = '';
  onlyWithOrders = false;
  historyLimit = 50;

  isLoadingClients = false;
  isLoadingClientDetails = false;
  listErrorMessage = '';
  detailErrorMessage = '';

  /**
   * Injeta servico de clientes e detector para sincronizar renderizacao.
   */
  constructor(
    private readonly adminClientsService: AdminClientsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  /**
   * Carrega lista inicial de clientes no primeiro paint da tela.
   */
  ngOnInit() {
    this.loadClients(false);
  }

  /**
   * Recarrega clientes aplicando filtros atuais.
   */
  applyFilters() {
    this.loadClients(true);
  }

  /**
   * Limpa filtros e recarrega lista sem restricoes.
   */
  clearFilters() {
    this.searchTerm = '';
    this.onlyWithOrders = false;
    this.loadClients(true);
  }

  /**
   * Seleciona cliente da lista e carrega consolidado + historico.
   */
  selectClient(clientId: number) {
    this.selectedClientId = clientId;
    this.loadSelectedClientDetails(clientId);
  }

  /**
   * Atualiza detalhe do cliente selecionado mantendo filtros.
   */
  refreshSelectedClient() {
    if (this.selectedClientId === null) {
      return;
    }

    this.loadSelectedClientDetails(this.selectedClientId);
  }

  /**
   * Traduz status para rotulo legivel no contexto de historico.
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
   * Resolve classes visuais de status para chips dos pedidos.
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
   * Converte valor numerico de resposta para numero seguro no template.
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
   * Retorna endereco resumido para exibicao quando existir.
   */
  getClientAddressSummary(client: AdminClientSummary) {
    const parts = [
      client.addressLine,
      client.neighborhood,
      client.city,
      client.state,
      client.zipCode,
    ].filter((part) => part && part.trim().length > 0);

    return parts.join(' - ');
  }

  /**
   * Carrega lista de clientes preservando selecao quando possivel.
   */
  private loadClients(preserveSelection: boolean) {
    this.isLoadingClients = true;
    this.listErrorMessage = '';

    this.adminClientsService
      .listClients({
        search: this.searchTerm.trim() || undefined,
        limit: 100,
        onlyWithOrders: this.onlyWithOrders,
      })
      .subscribe({
        next: (clients) => {
          this.isLoadingClients = false;
          this.clients = clients;

          if (preserveSelection && this.selectedClientId !== null) {
            const selectedFromList =
              this.clients.find((client) => client.id === this.selectedClientId) ?? null;

            if (!selectedFromList) {
              this.selectedClient = null;
              this.selectedClientId = null;
              this.selectedClientOrders = [];
            } else {
              this.selectedClient = selectedFromList;
              this.loadSelectedClientDetails(selectedFromList.id);
            }
          }

          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoadingClients = false;
          this.listErrorMessage =
            error?.error?.message && typeof error.error.message === 'string'
              ? error.error.message
              : 'Nao foi possivel carregar os clientes.';
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Carrega consolidado e historico de pedidos do cliente selecionado.
   *
   * Motivo:
   * usamos duas chamadas em paralelo para reduzir latencia de UI e garantir
   * que resumo e historico sejam atualizados de forma consistente no mesmo ciclo.
   */
  private loadSelectedClientDetails(clientId: number) {
    this.isLoadingClientDetails = true;
    this.detailErrorMessage = '';

    forkJoin({
      client: this.adminClientsService.getClientById(clientId),
      history: this.adminClientsService.getClientOrderHistory(clientId, {
        limit: this.historyLimit,
      }),
    }).subscribe({
      next: ({ client, history }) => {
        this.isLoadingClientDetails = false;
        this.selectedClient = client;
        this.selectedClientId = client.id;
        this.selectedClientOrders = history.orders;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingClientDetails = false;
        this.selectedClient = null;
        this.selectedClientOrders = [];
        this.detailErrorMessage =
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Nao foi possivel carregar detalhes do cliente.';
        this.cdr.detectChanges();
      },
    });
  }
}
