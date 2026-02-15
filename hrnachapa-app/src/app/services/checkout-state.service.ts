import { Injectable } from '@angular/core';
import { CartItem } from './cart.service';

export interface CheckoutFeedback {
  type: 'success' | 'error';
  message: string;
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
  checkout: CheckoutFormState = {
    name: '',
    whatsapp: '',
    address: '',
    couponCode: '',
    deliveryFee: 6,
    notes: '',
  };
  isSubmittingOrder = false;
  orderFeedback: CheckoutFeedback | null = null;

  /**
   * Aplica feedback visual no bloco de checkout.
   */
  setOrderFeedback(nextFeedback: CheckoutFeedback | null) {
    this.orderFeedback = nextFeedback;
  }

  /**
   * Sinaliza estado de envio de pedido para bloquear interacoes duplicadas.
   */
  setIsSubmittingOrder(nextValue: boolean) {
    this.isSubmittingOrder = nextValue;
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
      deliveryFee: 6,
      notes: '',
    };
    this.orderFeedback = null;
    this.isSubmittingOrder = false;
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
