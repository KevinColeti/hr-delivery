import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { CategorySectionComponent } from '../category-section/category-section';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Data,
  ParamMap,
  Params,
  Router,
  RouterLink,
} from '@angular/router';
import { combineLatest } from 'rxjs';
import { Product } from '../product-card/product-card';
import { CartService } from '../../services/cart.service';
import { CatalogStateService } from '../../services/catalog-state.service';
import { CheckoutStateService } from '../../services/checkout-state.service';
import { OrdersApiService } from '../../services/orders-api.service';
import { TrackingStateService } from '../../services/tracking-state.service';

type HomeViewMode = 'landing' | 'catalog' | 'cart' | 'checkout' | 'tracking' | 'order-status';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent,
    CategorySectionComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
/**
 * Componente principal da vitrine publica.
 *
 * Responsabilidades:
 * - coordenar navegacao do fluxo publico por rota;
 * - delegar estado de dominio para servicos (catalogo, checkout e tracking);
 * - orquestrar envio de pedido e redirecionamento pos-checkout.
 */
export class HomeComponent implements OnInit {
  private readonly storeWhatsAppPhone = '5511987654321';
  private readonly defaultCancellationTrackingMessage =
    'Tivemos um problema com o seu pedido, e precisamos cancelar.';
  currentViewMode: HomeViewMode = 'landing';
  selectedCategoryId = '';

  /**
   * Injeta dependencias de estado, API e navegacao.
   */
  constructor(
    private readonly cartService: CartService,
    private readonly catalogState: CatalogStateService,
    private readonly checkoutState: CheckoutStateService,
    private readonly trackingState: TrackingStateService,
    private readonly ordersApiService: OrdersApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  /**
   * Inicializa contexto de rota para separar fluxo publico por pagina.
   */
  ngOnInit() {
    this.bindRouteViewContext();
  }

  /**
   * Sinaliza se tela atual e landing.
   */
  get isLandingView() {
    return this.currentViewMode === 'landing';
  }

  /**
   * Sinaliza se tela atual e cardapio.
   */
  get isCatalogView() {
    return this.currentViewMode === 'catalog';
  }

  /**
   * Sinaliza se tela atual e carrinho.
   */
  get isCartView() {
    return this.currentViewMode === 'cart';
  }

  /**
   * Sinaliza se tela atual e checkout.
   */
  get isCheckoutView() {
    return this.currentViewMode === 'checkout';
  }

  /**
   * Sinaliza se tela atual e acompanhamento manual.
   */
  get isTrackingView() {
    return this.currentViewMode === 'tracking';
  }

  /**
   * Sinaliza se tela atual e detalhe de pedido por rota dedicada.
   */
  get isOrderStatusView() {
    return this.currentViewMode === 'order-status';
  }

  /**
   * Exposicao de categorias do catalogo.
   */
  get categories() {
    return this.catalogState.categories();
  }

  /**
   * Exposicao de produtos do catalogo.
   */
  get catalogProducts() {
    return this.catalogState.catalogProducts();
  }

  /**
   * Exposicao das categorias visiveis conforme filtro selecionado na URL.
   */
  get visibleCatalogCategories() {
    if (!this.selectedCategoryId) {
      return this.categories;
    }

    return this.categories.filter((category) => category.id === this.selectedCategoryId);
  }

  /**
   * Indica se o filtro atual resultou em lista sem itens visiveis.
   */
  get isCatalogEmptyForCurrentFilter() {
    if (this.catalogProducts.length === 0) {
      return true;
    }

    return this.visibleCatalogCategories.every(
      (category) => this.getProductsByCategory(category.id).length === 0,
    );
  }

  /**
   * Exposicao de destaques do catalogo.
   */
  get featuredItems() {
    if (!this.selectedCategoryId) {
      return this.catalogState.featuredItems();
    }

    return this.catalogState
      .featuredItems()
      .filter((item) => item.category === this.selectedCategoryId);
  }

  /**
   * Exposicao de estado de carregamento do catalogo.
   */
  get isCatalogLoading() {
    return this.catalogState.isCatalogLoading();
  }

  /**
   * Exposicao de erro do catalogo.
   */
  get catalogLoadError() {
    return this.catalogState.catalogLoadError();
  }

  /**
   * Exposicao do produto selecionado para configuracao.
   */
  get selectedProduct() {
    return this.catalogState.selectedProduct();
  }

  /**
   * Exposicao de estado de carregamento dos extras do produto.
   */
  get productDetailsLoading() {
    return this.catalogState.productDetailsLoading();
  }

  /**
   * Exposicao de erro de carregamento dos extras do produto.
   */
  get productDetailsError() {
    return this.catalogState.productDetailsError();
  }

  /**
   * Exposicao de extras disponiveis do produto em configuracao.
   */
  get selectedProductExtras() {
    return this.catalogState.selectedProductExtras();
  }

  /**
   * Exposicao de identificadores de extras selecionados.
   */
  get selectedExtraIds() {
    return this.catalogState.selectedExtraIds();
  }

  /**
   * Exposicao de observacao digitada no modal de produto.
   */
  get productObservation() {
    return this.catalogState.productObservation();
  }

  /**
   * Atualiza observacao do produto em configuracao.
   */
  set productObservation(nextValue: string) {
    this.catalogState.setProductObservation(nextValue);
  }

  /**
   * Exposicao do numero de pedido em acompanhamento.
   */
  get trackingOrderId() {
    return this.trackingState.trackingOrderId();
  }

  /**
   * Exposicao de estado de carregamento do tracking.
   */
  get trackingLoading() {
    return this.trackingState.trackingLoading();
  }

  /**
   * Exposicao de erro do tracking.
   */
  get trackingError() {
    return this.trackingState.trackingError();
  }

  /**
   * Exposicao de dados de tracking carregados.
   */
  get trackingData() {
    return this.trackingState.trackingData();
  }

  /**
   * Retorna mensagem de cancelamento para exibicao no tracking.
   *
   * Motivo:
   * mantemos fallback local para cobrir pedidos antigos cancelados antes da
   * persistencia da mensagem personalizada.
   */
  get trackingCancellationMessage() {
    if (!this.trackingData || this.trackingData.status !== 'canceled') {
      return '';
    }

    return (
      this.trackingData.cancellationCustomerMessage?.trim() ||
      this.defaultCancellationTrackingMessage
    );
  }

  /**
   * Exposicao do estado do formulario de checkout.
   */
  get checkout() {
    return this.checkoutState.checkout;
  }

  /**
   * Exposicao de estado de envio do checkout.
   */
  get isSubmittingOrder() {
    return this.checkoutState.isSubmittingOrder;
  }

  /**
   * Exposicao de feedback operacional do checkout.
   */
  get orderFeedback() {
    return this.checkoutState.orderFeedback;
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
    return this.catalogState.getProductsByCategory(categoryId);
  }

  /**
   * Informa se categoria esta selecionada no filtro atual da URL.
   */
  isCategorySelected(categoryId: string) {
    return this.selectedCategoryId === categoryId;
  }

  /**
   * Monta query params para navegar no filtro de categoria.
   */
  getCatalogCategoryQueryParams(categoryId?: string): Params {
    if (!categoryId) {
      return {};
    }

    return { categoria: categoryId };
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
    this.catalogState.openProductDetails(product);
  }

  /**
   * Fecha modal de detalhe e limpa estado temporario.
   */
  closeProductDetails() {
    this.catalogState.closeProductDetails();
  }

  /**
   * Marca/desmarca extra no detalhe.
   */
  toggleExtraSelection(extraId: number, checked: boolean) {
    this.catalogState.toggleExtraSelection(extraId, checked);
  }

  /**
   * Adiciona ao carrinho usando configuracao escolhida no detalhe.
   */
  addConfiguredProductToCart() {
    if (!this.selectedProduct) {
      return;
    }

    this.cartService.addConfiguredProduct(this.selectedProduct, {
      notes: this.productObservation.trim() || undefined,
      extraSelections: this.catalogState.buildSelectedExtraSelections(),
    });

    this.catalogState.closeProductDetails();
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
   * - cliente e deduplicado no backend pelo telefone informado;
   * - endereco segue como campo simplificado (`addressLine`) neste estagio.
   */
  submitOrder() {
    if (this.cartItems().length === 0) {
      this.checkoutState.setOrderFeedback({
        type: 'error',
        message: 'Adicione itens no carrinho antes de finalizar.',
      });
      return;
    }

    const clientName = this.checkout.name.trim();
    if (clientName.length < 3) {
      this.checkoutState.setOrderFeedback({
        type: 'error',
        message: 'Informe o nome do cliente para finalizar o pedido.',
      });
      return;
    }

    const normalizedPhone = this.checkoutState.normalizePhoneForCheckout(this.checkout.whatsapp);
    if (!normalizedPhone) {
      this.checkoutState.setOrderFeedback({
        type: 'error',
        message: 'Informe um telefone valido para finalizar o pedido.',
      });
      return;
    }

    this.checkoutState.setIsSubmittingOrder(true);
    this.checkoutState.setOrderFeedback(null);

    this.ordersApiService
      .createPublicCheckoutOrder({
        client: {
          name: clientName,
          phone: normalizedPhone,
          addressLine: this.checkout.address.trim() || undefined,
        },
        items: this.cartItems().map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          extras: item.extraSelections?.map((extra) => ({
            extraId: extra.extraId,
            quantity: extra.quantity,
          })),
        })),
        deliveryFee: this.checkout.deliveryFee || 0,
        couponCode: this.checkout.couponCode.trim() || undefined,
        notes: this.checkoutState.buildOrderNotesForCheckout(this.cartItems()),
      })
      .subscribe({
        next: (order) => {
          this.checkoutState.resetAfterSuccessfulCheckout();
          this.cartService.clear();
          this.trackingState.setOwnedOrderId(order.id);
          // Direcionamos para rota dedicada de pedido para manter
          // o acompanhamento como destino canonico pos-checkout.
          void this.router.navigate(['/pedido', order.id]);
        },
        error: (error) => {
          this.checkoutState.setIsSubmittingOrder(false);
          const apiMessage =
            error?.error?.message && typeof error.error.message === 'string'
              ? error.error.message
              : 'Falha ao criar pedido. Verifique os dados e tente novamente.';
          this.checkoutState.setOrderFeedback({
            type: 'error',
            message: apiMessage,
          });
        },
      });
  }

  /**
   * Abre rota de acompanhamento para o pedido do dispositivo atual.
   */
  openCurrentOrderTracking() {
    const ownedOrderId = this.trackingState.getOwnedOrderId();
    if (!ownedOrderId) {
      this.trackingState.setNoActiveOrderState();
      return;
    }

    void this.router.navigate(['/pedido', ownedOrderId]);
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
   * Sincroniza componente com rota publica atual.
   *
   * Motivo:
   * mantemos o mesmo componente em rotas diferentes enquanto o fluxo
   * ainda esta em transicao; isso reduz duplicacao de template sem perder
   * URLs dedicadas por etapa.
   */
  private bindRouteViewContext() {
    combineLatest([this.route.data, this.route.paramMap, this.route.queryParamMap]).subscribe(
      ([data, paramMap, queryParamMap]) => {
        this.currentViewMode = this.resolveViewModeFromRouteData(data);
        this.selectedCategoryId = this.resolveCategoryFilterFromQuery(
          queryParamMap.get('categoria'),
        );

        if (this.isCatalogView) {
          this.catalogState.ensureCatalogLoaded();
        } else if (this.selectedProduct) {
          this.catalogState.closeProductDetails();
        }

        if (this.isTrackingView) {
          this.openCurrentOrderTracking();
        }

        if (this.isOrderStatusView) {
          this.loadTrackingByRouteParam(paramMap);
        } else {
          this.trackingState.stopAutoRefresh();
        }
      },
    );
  }

  /**
   * Resolve modo visual da tela a partir dos dados declarados na rota.
   */
  private resolveViewModeFromRouteData(data: Data): HomeViewMode {
    const routeView = data['view'];
    const allowedViews: HomeViewMode[] = [
      'landing',
      'catalog',
      'cart',
      'checkout',
      'tracking',
      'order-status',
    ];

    if (typeof routeView !== 'string') {
      return 'landing';
    }

    return allowedViews.includes(routeView as HomeViewMode)
      ? (routeView as HomeViewMode)
      : 'landing';
  }

  /**
   * Resolve filtro de categoria recebido na query string.
   *
   * Motivo:
   * manter o filtro acoplado a URL permite compartilhamento de links
   * e preserva contexto ao navegar entre paginas do fluxo.
   */
  private resolveCategoryFilterFromQuery(rawCategory: string | null) {
    if (!rawCategory) {
      return '';
    }

    return rawCategory.trim();
  }

  /**
   * Carrega tracking automaticamente quando rota de pedido contem id valido.
   */
  private loadTrackingByRouteParam(paramMap: ParamMap) {
    const rawOrderId = paramMap.get('id');
    const parsedOrderId = Number(rawOrderId);

    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      this.trackingState.setNoActiveOrderState();
      return;
    }

    if (!this.trackingState.isOwnedOrder(parsedOrderId)) {
      this.trackingState.setForbiddenOrderState();
      const ownedOrderId = this.trackingState.getOwnedOrderId();
      if (ownedOrderId) {
        void this.router.navigate(['/pedido', ownedOrderId]);
      } else {
        void this.router.navigate(['/']);
      }
      return;
    }

    this.trackingState.startAutoRefresh(parsedOrderId);
  }
}
