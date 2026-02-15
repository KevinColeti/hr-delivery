import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

export type AdminOrderStatus =
  | 'new'
  | 'confirmed'
  | 'in_preparation'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'canceled';

export interface AdminOrderItemExtra {
  id: number;
  orderItemId: number;
  productExtraId: number | null;
  extraName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface AdminOrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  extras?: AdminOrderItemExtra[];
}

export interface AdminOrderClient {
  id: number;
  name: string;
  phone: string;
  addressLine: string | null;
}

export interface AdminOrder {
  id: number;
  clientId: number;
  status: AdminOrderStatus;
  subtotal: string;
  deliveryFee: string;
  discountAmount: string;
  total: string;
  notes: string | null;
  cancellationCustomerMessage: string | null;
  cancellationInternalNote: string | null;
  createdAt: string;
  updatedAt: string;
  client: AdminOrderClient;
  items: AdminOrderItem[];
  appliedCouponCode: string | null;
  appliedComboName: string | null;
}

export interface UpdateAdminOrderStatusPayload {
  status: AdminOrderStatus;
  cancellationCustomerMessage?: string;
  cancellationInternalNote?: string;
}

export interface AdminOrderStatusHistoryEntry {
  id: number;
  orderId: number;
  previousStatus: AdminOrderStatus;
  nextStatus: AdminOrderStatus;
  changedByName: string | null;
  changedByEmail: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Adaptador de pedidos para o frontend administrativo.
 *
 * Centraliza chamadas de modulo de pedidos/cozinha para manter pagina e
 * componentes focados em estado de tela, nao em detalhes de transporte HTTP.
 */
export class AdminOrdersService {
  private readonly baseUrl = 'http://localhost:3000/orders';

  /**
   * Injeta cliente HTTP para consumo dos endpoints administrativos.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Lista pedidos da operacao (admin/kitchen).
   */
  listOrders() {
    return this.http.get<AdminOrder[]>(this.baseUrl);
  }

  /**
   * Busca pedido individual por identificador.
   */
  getOrderById(orderId: number) {
    return this.http.get<AdminOrder>(`${this.baseUrl}/${orderId}`);
  }

  /**
   * Lista historico de alteracoes de status do pedido.
   */
  listOrderStatusHistory(orderId: number) {
    return this.http.get<AdminOrderStatusHistoryEntry[]>(`${this.baseUrl}/${orderId}/status-history`);
  }

  /**
   * Atualiza status de pedido por acao operacional.
   */
  updateOrderStatus(orderId: number, payload: UpdateAdminOrderStatusPayload) {
    return this.http.patch<AdminOrder>(`${this.baseUrl}/${orderId}/status`, payload);
  }

  /**
   * Reverte cancelamento para status `confirmed`.
   */
  revertOrderCancellation(orderId: number) {
    return this.http.patch<AdminOrder>(`${this.baseUrl}/${orderId}/cancellation/revert`, {});
  }

  /**
   * Lista board operacional da cozinha.
   */
  listKitchenBoard(params?: { includeReady?: boolean; limit?: number }) {
    let queryParams = new HttpParams();
    if (params?.includeReady !== undefined) {
      queryParams = queryParams.set('includeReady', String(params.includeReady));
    }
    if (params?.limit !== undefined) {
      queryParams = queryParams.set('limit', String(params.limit));
    }

    return this.http.get<AdminOrder[]>(`${this.baseUrl}/kitchen/board`, {
      params: queryParams,
    });
  }

  /**
   * Acao rapida da cozinha para marcar pedido como pronto.
   */
  markOrderReady(orderId: number) {
    return this.http.patch<AdminOrder>(`${this.baseUrl}/${orderId}/kitchen/ready`, {});
  }
}
