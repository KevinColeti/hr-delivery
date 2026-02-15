import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { CategorySectionComponent } from '../category-section/category-section';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { categories as mockCategories, products as mockProducts } from '../../data/products';
import { Product } from '../product-card/product-card';
import { CartService } from '../../services/cart.service';
import {
  CatalogApiService,
  PublicCatalogCategoryResponse,
  PublicCatalogProductExtraResponse,
  PublicCatalogProductResponse,
} from '../../services/catalog-api.service';
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
/**
 * Componente principal da vitrine publica.
 *
 * Responsabilidades:
 * - carregar catalogo publico da API com fallback local;
 * - controlar carrinho e checkout;
 * - permitir acompanhamento publico de pedido;
 * - oferecer canal de contato via WhatsApp.
 */
export class HomeComponent {
  private readonly defaultProductImage =
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop';
  private readonly storeWhatsAppPhone = '5511987654321';

  categories = mockCategories;
  catalogProducts: Product[] = mockProducts;
  featuredItems = this.catalogProducts.slice(0, 3);
  isCatalogLoading = false;
  catalogLoadError = '';
  selectedProduct: Product | null = null;
  productDetailsLoading = false;
  productDetailsError = '';
  selectedProductExtras: PublicCatalogProductExtraResponse[] = [];
  selectedExtraIds: number[] = [];
  productObservation = '';

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

  /**
   * Injeta dependencias de estado local e comunicacao com backend.
   */
  constructor(
    private readonly cartService: CartService,
    private readonly catalogApiService: CatalogApiService,
    private readonly ordersApiService: OrdersApiService,
  ) {}

  /**
   * Inicializa carga do catalogo real no primeiro render.
   */
  ngOnInit() {
    this.loadPublicCatalog();
  }

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

  /**
   * Filtra produtos da vitrine pela categoria selecionada.
   */
  getProductsByCategory(categoryId: string): Product[] {
    return this.catalogProducts.filter(product => product.category === categoryId);
  }

  /**
   * Adiciona item ao carrinho.
   */
  addToCart(product: Product) {
    this.cartService.addProduct(product);
  }

  /**
   * Abre modal de detalhe do produto com extras publicos.
   */
  openProductDetails(product: Product) {
    // Limpamos estado anterior antes de nova consulta para evitar misturar
    // extras e observacoes de produtos diferentes no mesmo modal.
    this.selectedProduct = product;
    this.selectedProductExtras = [];
    this.selectedExtraIds = [];
    this.productObservation = '';
    this.productDetailsError = '';
    this.productDetailsLoading = true;

    this.catalogApiService.getProductPublicExtras(product.id).subscribe({
      next: (extras) => {
        this.productDetailsLoading = false;
        this.selectedProductExtras = extras;
      },
      error: () => {
        this.productDetailsLoading = false;
        this.selectedProductExtras = [];
        this.productDetailsError = 'Nao foi possivel carregar os extras deste produto.';
      },
    });
  }

  /**
   * Fecha modal de detalhe e limpa estado temporario.
   */
  closeProductDetails() {
    this.selectedProduct = null;
    this.selectedProductExtras = [];
    this.selectedExtraIds = [];
    this.productObservation = '';
    this.productDetailsError = '';
    this.productDetailsLoading = false;
  }

  /**
   * Marca/desmarca extra no detalhe.
   */
  toggleExtraSelection(extraId: number, checked: boolean) {
    if (checked) {
      this.selectedExtraIds = [...this.selectedExtraIds, extraId];
      return;
    }

    this.selectedExtraIds = this.selectedExtraIds.filter((id) => id !== extraId);
  }

  /**
   * Adiciona ao carrinho usando configuracao escolhida no detalhe.
   */
  addConfiguredProductToCart() {
    if (!this.selectedProduct) {
      return;
    }

    const extrasSummary = this.selectedProductExtras
      .filter((extra) => this.selectedExtraIds.includes(extra.id))
      .map((extra) => extra.name);

    this.cartService.addConfiguredProduct(this.selectedProduct, {
      notes: this.productObservation.trim() || undefined,
      extrasSummary,
    });

    this.closeProductDetails();
  }

  /**
   * Ajusta quantidade de item no carrinho.
   */
  changeItemQuantity(itemKey: string, nextQuantity: number) {
    this.cartService.updateQuantity(itemKey, nextQuantity);
  }

  /**
   * Remove item do carrinho.
   */
  removeFromCart(itemKey: string) {
    this.cartService.removeItem(itemKey);
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
        notes: this.buildOrderNotesForCheckout(),
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
    // Evita exibir timeline do pedido anterior enquanto consulta o novo id.
    this.trackingData = null;

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

  /**
   * Consolida observacoes locais de itens em um campo unico de pedido.
   *
   * Motivo:
   * o payload atual do backend ainda nao possui observacao por item,
   * entao preservamos contexto operacional no `notes` geral do pedido.
   */
  private buildOrderNotesForCheckout() {
    const notesBlocks = this.cartItems()
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

  /**
   * Carrega catalogo publico da API com fallback para dados mock.
   *
   * Motivo:
   * manter a vitrine navegavel mesmo se backend estiver fora, evitando
   * pagina vazia durante validacao local.
   */
  private loadPublicCatalog() {
    this.isCatalogLoading = true;
    this.catalogLoadError = '';

    this.catalogApiService.getPublicCatalog().subscribe({
      next: (response) => {
        this.isCatalogLoading = false;
        this.categories = response.categories.map((category) =>
          this.mapCategoryFromApi(category),
        );
        this.catalogProducts = response.products.map((product) =>
          this.mapProductFromApi(product),
        );
        this.featuredItems = this.catalogProducts.slice(0, 3);
      },
      error: () => {
        this.isCatalogLoading = false;
        this.categories = mockCategories;
        this.catalogProducts = mockProducts;
        this.featuredItems = this.catalogProducts.slice(0, 3);
        this.catalogLoadError =
          'Catalogo indisponivel no momento. Exibindo vitrine local temporaria.';
      },
    });
  }

  /**
   * Normaliza categoria da API para o modelo visual do frontend.
   */
  private mapCategoryFromApi(category: PublicCatalogCategoryResponse) {
    return {
      id: category.slug,
      name: category.name,
    };
  }

  /**
   * Normaliza produto da API para o modelo visual do frontend.
   */
  private mapProductFromApi(product: PublicCatalogProductResponse): Product {
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: Number(product.price),
      image: product.imageUrl || this.defaultProductImage,
      category: product.category.slug,
      isAvailable: product.availability?.available ?? false,
    };
  }
}
