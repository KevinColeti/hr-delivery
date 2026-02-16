import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface CreateOrderPayload {
  clientId: number;
  items: Array<{
    productId: number;
    quantity: number;
    extras?: Array<{
      extraId: number;
      quantity: number;
    }>;
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
    extras?: Array<{
      extraId: number;
      quantity: number;
    }>;
  }>;
  deliveryFee?: number;
  couponCode?: string;
  notes?: string;
}

interface ValidatePublicCouponPayload {
  code: string;
  subtotal: number;
  clientPhone?: string;
}

export interface ValidatePublicCouponResponse {
  valid: boolean;
  code: string;
  message: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  discountAmount: string;
  subtotal: string;
  finalSubtotal: string;
  minimumOrderAmount: string;
  firstOrderOnly: boolean;
}

export interface OrderTrackingResponse {
  id: number;
  status: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  cancellationCustomerMessage: string | null;
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
  private readonly couponsBaseUrl = 'http://localhost:3000/coupons';

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
   * Valida cupom no contexto do checkout publico sem criar pedido.
   */
  validatePublicCoupon(payload: ValidatePublicCouponPayload) {
    return this.http.post<ValidatePublicCouponResponse>(
      `${this.couponsBaseUrl}/public/validate`,
      payload,
    );
  }

  /**
   * Consulta status publico de acompanhamento por identificador.
   */
  getOrderTracking(orderId: number) {
    return this.http.get<OrderTrackingResponse>(`${this.baseUrl}/${orderId}/tracking`);
  }
}
