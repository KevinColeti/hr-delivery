import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { CategorySectionComponent } from '../category-section/category-section';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { products, categories } from '../../data/products';
import { Product } from '../product-card/product-card';
import { CartService } from '../../services/cart.service';
import {
  OrderTrackingResponse,
  OrdersApiService,
} from '../../services/orders-api.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, CategorySectionComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  private readonly storeWhatsAppPhone = '5511987654321';

  categories = categories;
  featuredItems = products.slice(0, 3);

  trackingOrderId = '';
  trackingLoading = false;
  trackingError = '';
  trackingData: OrderTrackingResponse | null = null;

  checkout = {
    clientId: '',
    whatsapp: '',
    address: '',
    couponCode: '',
    deliveryFee: 6,
    notes: '',
  };
  isSubmittingOrder = false;
  orderFeedback: { type: 'success' | 'error'; message: string } | null = null;

  constructor(
    private readonly cartService: CartService,
    private readonly ordersApiService: OrdersApiService,
  ) {}

  /**
   * Exposicao do estado do carrinho para template.
   */
  get cartItems() {
    return this.cartService.items;
  }

  /**
   * Exposicao do subtotal calculado pelo carrinho.
   */
  get cartSubtotal() {
    return this.cartService.subtotal;
  }

  /**
   * Exposicao da quantidade total de itens do carrinho.
   */
  get cartTotalItems() {
    return this.cartService.totalItems;
  }

  getProductsByCategory(categoryId: string): Product[] {
    return products.filter(product => product.category === categoryId);
  }

  /**
   * Adiciona item ao carrinho.
   */
  addToCart(product: Product) {
    this.cartService.addProduct(product);
  }

  /**
   * Ajusta quantidade de item no carrinho.
   */
  changeItemQuantity(productId: number, nextQuantity: number) {
    this.cartService.updateQuantity(productId, nextQuantity);
  }

  /**
   * Remove item do carrinho.
   */
  removeFromCart(productId: number) {
    this.cartService.removeItem(productId);
  }

  /**
   * Retorna total final (subtotal + taxa fixa de entrega local).
   */
  get orderTotal() {
    return this.cartSubtotal() + (this.checkout.deliveryFee || 0);
  }

  /**
   * Envia pedido para API usando estado do carrinho local.
   *
   * Observacao:
   * - o backend atual exige `clientId` existente;
   * - campos de contato/endereco seguem como dados de tela neste estagio.
   */
  submitOrder() {
    if (this.cartItems().length === 0) {
      this.orderFeedback = {
        type: 'error',
        message: 'Adicione itens no carrinho antes de finalizar.',
      };
      return;
    }

    const clientId = Number(this.checkout.clientId);
    if (!Number.isInteger(clientId) || clientId <= 0) {
      this.orderFeedback = {
        type: 'error',
        message: 'Informe um clientId valido para criar o pedido.',
      };
      return;
    }

    this.isSubmittingOrder = true;
    this.orderFeedback = null;

    this.ordersApiService
      .createOrder({
        clientId,
        items: this.cartItems().map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        deliveryFee: this.checkout.deliveryFee || 0,
        couponCode: this.checkout.couponCode.trim() || undefined,
        notes: this.checkout.notes.trim() || undefined,
      })
      .subscribe({
        next: (order) => {
          this.isSubmittingOrder = false;
          this.cartService.clear();
          this.trackingOrderId = String(order.id);
          this.loadTracking();
          this.orderFeedback = {
            type: 'success',
            message: `Pedido #${order.id} criado com sucesso.`,
          };
        },
        error: (error) => {
          this.isSubmittingOrder = false;
          const apiMessage =
            error?.error?.message && typeof error.error.message === 'string'
              ? error.error.message
              : 'Falha ao criar pedido. Verifique os dados e tente novamente.';
          this.orderFeedback = {
            type: 'error',
            message: apiMessage,
          };
        },
      });
  }

  /**
   * Consulta acompanhamento publico por id digitado.
   */
  loadTracking() {
    const orderId = Number(this.trackingOrderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      this.trackingError = 'Informe um numero de pedido valido.';
      this.trackingData = null;
      return;
    }

    this.trackingLoading = true;
    this.trackingError = '';

    this.ordersApiService.getOrderTracking(orderId).subscribe({
      next: (response) => {
        this.trackingLoading = false;
        this.trackingData = response;
      },
      error: (error) => {
        this.trackingLoading = false;
        this.trackingData = null;
        this.trackingError =
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Nao foi possivel consultar o pedido.';
      },
    });
  }

  /**
   * Abre WhatsApp da loja com mensagem contextual do fluxo atual.
   *
   * Motivo:
   * facilitar suporte operacional sem exigir que o cliente copie numero
   * ou descreva manualmente o pedido.
   */
  openWhatsAppContact() {
    const message = this.buildWhatsAppMessage();
    const url = `https://wa.me/${this.storeWhatsAppPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Informa se ja existe contexto minimo para contato assistido.
   */
  get canContactWhatsApp() {
    return this.trackingData !== null || this.trackingOrderId.trim().length > 0;
  }

  /**
   * Monta mensagem padrao para abrir conversa com contexto de pedido.
   */
  private buildWhatsAppMessage() {
    if (this.trackingData) {
      return `Ola! Gostaria de ajuda com o pedido #${this.trackingData.id} (status: ${this.trackingData.status}).`;
    }

    const parsedOrderId = Number(this.trackingOrderId);
    if (Number.isInteger(parsedOrderId) && parsedOrderId > 0) {
      return `Ola! Gostaria de informacoes sobre o pedido #${parsedOrderId}.`;
    }

    return 'Ola! Gostaria de atendimento sobre meu pedido.';
  }
}
