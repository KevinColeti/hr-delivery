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

  constructor(private readonly http: HttpClient) {}

  /**
   * Cria pedido no backend com payload de checkout.
   */
  createOrder(payload: CreateOrderPayload) {
    return this.http.post<{ id: number; status: string }>(this.baseUrl, payload);
  }

  /**
   * Consulta status de acompanhamento publico do pedido.
   */
  getOrderTracking(orderId: number) {
    return this.http.get<OrderTrackingResponse>(`${this.baseUrl}/${orderId}/tracking`);
  }
}
