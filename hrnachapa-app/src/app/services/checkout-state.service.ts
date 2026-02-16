import { Injectable, signal } from '@angular/core';
import { CartItem } from './cart.service';

export interface CheckoutFeedback {
  type: 'success' | 'error';
  message: string;
}

export interface CheckoutCouponFeedback {
  type: 'success' | 'error';
  message: string;
  code?: string;
  discountAmount?: number;
}

export interface CheckoutFormState {
  name: string;
  whatsapp: string;
  address: string;
  couponCode: string;
  deliveryFee: number;
  notes: string;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Estado de dominio do checkout publico.
 *
 * Responsabilidades:
 * - manter formulario de checkout entre navegacoes;
 * - centralizar validacoes utilitarias de telefone e observacoes;
 * - concentrar feedback operacional do envio de pedido.
 */
export class CheckoutStateService {
  private deliveryFeeDefault = 6;
  private readonly isSubmittingOrderSignal = signal(false);
  private readonly isValidatingCouponSignal = signal(false);
  private readonly orderFeedbackSignal = signal<CheckoutFeedback | null>(null);
  private readonly couponFeedbackSignal = signal<CheckoutCouponFeedback | null>(null);

  checkout: CheckoutFormState = {
    name: '',
    whatsapp: '',
    address: '',
    couponCode: '',
    deliveryFee: this.deliveryFeeDefault,
    notes: '',
  };

  readonly isSubmittingOrder = this.isSubmittingOrderSignal.asReadonly();
  readonly isValidatingCoupon = this.isValidatingCouponSignal.asReadonly();
  readonly orderFeedback = this.orderFeedbackSignal.asReadonly();
  readonly couponFeedback = this.couponFeedbackSignal.asReadonly();

  /**
   * Aplica feedback visual no bloco de checkout.
   */
  setOrderFeedback(nextFeedback: CheckoutFeedback | null) {
    this.orderFeedbackSignal.set(nextFeedback);
  }

  /**
   * Sinaliza estado de envio de pedido para bloquear interacoes duplicadas.
   */
  setIsSubmittingOrder(nextValue: boolean) {
    this.isSubmittingOrderSignal.set(nextValue);
  }

  /**
   * Sinaliza estado de validacao de cupom para bloquear clique duplicado.
   */
  setIsValidatingCoupon(nextValue: boolean) {
    this.isValidatingCouponSignal.set(nextValue);
  }

  /**
   * Aplica feedback de validacao de cupom no checkout.
   */
  setCouponFeedback(nextFeedback: CheckoutCouponFeedback | null) {
    this.couponFeedbackSignal.set(nextFeedback);
  }

  /**
   * Limpa feedback de cupom quando contexto de validacao muda.
   */
  clearCouponFeedback() {
    this.couponFeedbackSignal.set(null);
  }

  /**
   * Atualiza taxa de entrega padrao da loja no estado do checkout.
   *
   * Motivo:
   * mantemos um valor padrao centralizado para garantir que resumos, reset do
   * checkout e primeiro preenchimento usem a mesma referencia operacional.
   */
  setDeliveryFeeDefault(nextDeliveryFeeDefault: number) {
    this.deliveryFeeDefault = nextDeliveryFeeDefault;
    this.checkout.deliveryFee = nextDeliveryFeeDefault;
  }

  /**
   * Limpa formulario apos criacao de pedido com sucesso.
   */
  resetAfterSuccessfulCheckout() {
    this.checkout = {
      name: '',
      whatsapp: '',
      address: '',
      couponCode: '',
      deliveryFee: this.deliveryFeeDefault,
      notes: '',
    };
    this.orderFeedbackSignal.set(null);
    this.isSubmittingOrderSignal.set(false);
    this.isValidatingCouponSignal.set(false);
    this.couponFeedbackSignal.set(null);
  }

  /**
   * Normaliza telefone para formato apenas numerico.
   */
  normalizePhoneForCheckout(rawPhone: string) {
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return null;
    }

    return digitsOnly;
  }

  /**
   * Consolida observacoes de checkout e itens em um bloco unico.
   *
   * Motivo:
   * enquanto nao existe campo dedicado de observacao por item no backend,
   * preservamos contexto operacional no campo geral `notes`.
   */
  buildOrderNotesForCheckout(cartItems: ReadonlyArray<CartItem>) {
    const notesBlocks = cartItems
      .map((item) => {
        const details: string[] = [];
        if (item.extrasSummary && item.extrasSummary.length > 0) {
          details.push(`extras: ${item.extrasSummary.join(', ')}`);
        }
        if (item.notes) {
          details.push(`obs: ${item.notes}`);
        }
        if (details.length === 0) {
          return '';
        }
        return `${item.name} x${item.quantity} (${details.join(' | ')})`;
      })
      .filter((line) => line.length > 0);

    const checkoutNotes = this.checkout.notes.trim();
    const mergedNotes = [checkoutNotes, ...notesBlocks].filter((line) => line.length > 0);
    return mergedNotes.length > 0 ? mergedNotes.join('\n') : undefined;
  }
}
