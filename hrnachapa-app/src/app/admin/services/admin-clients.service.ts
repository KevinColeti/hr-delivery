import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AdminOrder } from './admin-orders.service';

export interface AdminClientSummary {
  id: number;
  name: string;
  phone: string;
  addressLine: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
  nonCanceledOrdersCount: number;
  canceledOrdersCount: number;
  totalSpent: string;
  lastOrderAt: string | null;
}

export interface AdminClientOrderHistoryResponse {
  client: AdminClientSummary;
  orders: AdminOrder[];
}

@Injectable({
  providedIn: 'root',
})
/**
 * Adaptador HTTP de clientes para o painel administrativo.
 *
 * Centraliza consumo do modulo de clientes para manter pagina focada em
 * estado de interface e reduzir acoplamento de query string no componente.
 */
export class AdminClientsService {
  private readonly baseUrl = 'http://localhost:3000/clients';

  /**
   * Injeta cliente HTTP para chamadas administrativas de clientes.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Lista clientes com filtros operacionais opcionais.
   */
  listClients(params?: { search?: string; limit?: number; onlyWithOrders?: boolean }) {
    let queryParams = new HttpParams();
    if (params?.search) {
      queryParams = queryParams.set('search', params.search);
    }
    if (params?.limit !== undefined) {
      queryParams = queryParams.set('limit', String(params.limit));
    }
    if (params?.onlyWithOrders !== undefined) {
      queryParams = queryParams.set('onlyWithOrders', String(params.onlyWithOrders));
    }

    return this.http.get<AdminClientSummary[]>(this.baseUrl, {
      params: queryParams,
    });
  }

  /**
   * Busca dados consolidados de um cliente.
   */
  getClientById(clientId: number) {
    return this.http.get<AdminClientSummary>(`${this.baseUrl}/${clientId}`);
  }

  /**
   * Busca historico de pedidos de um cliente.
   */
  getClientOrderHistory(clientId: number, params?: { limit?: number }) {
    let queryParams = new HttpParams();
    if (params?.limit !== undefined) {
      queryParams = queryParams.set('limit', String(params.limit));
    }

    return this.http.get<AdminClientOrderHistoryResponse>(`${this.baseUrl}/${clientId}/orders`, {
      params: queryParams,
    });
  }
}
