import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../components/product-card/product-card';

export interface CartItem {
  key: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  extrasSummary?: string[];
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
    const itemKey = this.buildItemKey(product.id);
    const current = this.itemsSignal();
    const existing = current.find((item) => item.key === itemKey);

    if (!existing) {
      this.setItems([
        ...current,
        {
          key: itemKey,
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
        item.key === itemKey
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  /**
   * Adiciona produto personalizado (extras/observacao) sem colidir com item base.
   */
  addConfiguredProduct(product: Product, options: { notes?: string; extrasSummary?: string[] }) {
    const normalizedNotes = options.notes?.trim() || undefined;
    const normalizedExtras =
      options.extrasSummary?.map((extra) => extra.trim()).filter((extra) => extra.length > 0) ??
      [];
    const itemKey = this.buildItemKey(product.id, normalizedNotes, normalizedExtras);
    const current = this.itemsSignal();
    const existing = current.find((item) => item.key === itemKey);

    if (!existing) {
      this.setItems([
        ...current,
        {
          key: itemKey,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          notes: normalizedNotes,
          extrasSummary: normalizedExtras.length > 0 ? normalizedExtras : undefined,
        },
      ]);
      return;
    }

    this.setItems(
      current.map((item) =>
        item.key === itemKey ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  }

  /**
   * Atualiza quantidade de item respeitando minimo de 1.
   */
  updateQuantity(itemKey: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(itemKey);
      return;
    }

    this.setItems(
      this.itemsSignal().map((item) =>
        item.key === itemKey ? { ...item, quantity } : item,
      ),
    );
  }

  /**
   * Remove item do carrinho.
   */
  removeItem(itemKey: string) {
    this.setItems(this.itemsSignal().filter((item) => item.key !== itemKey));
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
          typeof item?.key === 'string' &&
          typeof item?.productId === 'number' &&
          typeof item?.name === 'string' &&
          typeof item?.price === 'number' &&
          typeof item?.quantity === 'number' &&
          (item?.notes === undefined || typeof item?.notes === 'string') &&
          (item?.extrasSummary === undefined || Array.isArray(item?.extrasSummary)),
      );
    } catch {
      return [];
    }
  }

  /**
   * Gera chave deterministica para agrupar somente itens equivalentes.
   */
  private buildItemKey(productId: number, notes?: string, extrasSummary?: string[]) {
    const extrasKey = extrasSummary?.join('|') ?? '';
    return `${productId}::${notes ?? ''}::${extrasKey}`;
  }
}
