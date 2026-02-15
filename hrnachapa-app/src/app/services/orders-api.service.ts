import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface CreateOrderPayload {
  clientId: number;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  deliveryFee?: number;
  couponCode?: string;
  notes?: string;
}

interface CreatePublicCheckoutOrderPayload {
  client: {
    name: string;
    phone: string;
    addressLine?: string;
  };
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  deliveryFee?: number;
  couponCode?: string;
  notes?: string;
}

export interface OrderTrackingResponse {
  id: number;
  status: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  timeline: Array<{
    status: string;
    label: string;
    done: boolean;
  }>;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Adaptador HTTP para endpoints de pedidos do backend.
 */
export class OrdersApiService {
  private readonly baseUrl = 'http://localhost:3000/orders';

  /**
   * Injeta cliente HTTP para chamadas de pedidos publicos.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Cria pedido no backend com dados consolidados do checkout.
   */
  createOrder(payload: CreateOrderPayload) {
    return this.http.post<{ id: number; status: string }>(this.baseUrl, payload);
  }

  /**
   * Executa checkout publico resolvendo cliente automaticamente por telefone.
   */
  createPublicCheckoutOrder(payload: CreatePublicCheckoutOrderPayload) {
    return this.http.post<{ id: number; status: string }>(`${this.baseUrl}/checkout`, payload);
  }

  /**
   * Consulta status publico de acompanhamento por identificador.
   */
  getOrderTracking(orderId: number) {
    return this.http.get<OrderTrackingResponse>(`${this.baseUrl}/${orderId}/tracking`);
  }
}
