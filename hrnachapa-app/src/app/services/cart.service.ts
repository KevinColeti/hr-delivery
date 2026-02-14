import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../components/product-card/product-card';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Mantem estado do carrinho no frontend.
 *
 * Decisoes:
 * - usa `signal` para atualizacao reativa simples sem boilerplate;
 * - persiste em localStorage para nao perder carrinho ao recarregar pagina.
 */
export class CartService {
  private readonly storageKey = 'hrnachapa_cart_v1';
  private readonly itemsSignal = signal<CartItem[]>(this.loadFromStorage());

  readonly items = this.itemsSignal.asReadonly();
  readonly totalItems = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  /**
   * Adiciona produto ao carrinho acumulando quantidade.
   */
  addProduct(product: Product) {
    const current = this.itemsSignal();
    const existing = current.find((item) => item.productId === product.id);

    if (!existing) {
      this.setItems([
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
      return;
    }

    this.setItems(
      current.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  /**
   * Atualiza quantidade de item respeitando minimo de 1.
   */
  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this.setItems(
      this.itemsSignal().map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  }

  /**
   * Remove item do carrinho.
   */
  removeItem(productId: number) {
    this.setItems(this.itemsSignal().filter((item) => item.productId !== productId));
  }

  /**
   * Limpa carrinho apos pedido finalizado.
   */
  clear() {
    this.setItems([]);
  }

  /**
   * Centraliza escrita no estado + persistencia.
   */
  private setItems(items: CartItem[]) {
    this.itemsSignal.set(items);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  /**
   * Carrega carrinho persistido com fallback seguro.
   */
  private loadFromStorage(): CartItem[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (item) =>
          typeof item?.productId === 'number' &&
          typeof item?.name === 'string' &&
          typeof item?.price === 'number' &&
          typeof item?.quantity === 'number',
      );
    } catch {
      return [];
    }
  }
}
