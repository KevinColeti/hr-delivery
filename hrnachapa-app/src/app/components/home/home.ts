import { Component, OnInit, effect } from '@angular/core';
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
import {
  OrdersApiService,
  ValidatePublicCouponResponse,
} from '../../services/orders-api.service';
import { PublicStoreSettingsService } from '../../services/public-store-settings.service';
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
  private readonly fallbackStoreWhatsAppPhone = '5511987654321';
  private readonly defaultCancellationTrackingMessage =
    'Tivemos um problema com o seu pedido, e precisamos cancelar.';
  currentViewMode: HomeViewMode = 'landing';
  selectedCategoryId = '';
  private productRouteSyncVersion = 0;

  /**
   * Injeta dependencias de estado, API e navegacao.
   */
  constructor(
    private readonly cartService: CartService,
    private readonly catalogState: CatalogStateService,
    private readonly checkoutState: CheckoutStateService,
    private readonly publicStoreSettingsService: PublicStoreSettingsService,
    private readonly trackingState: TrackingStateService,
    private readonly ordersApiService: OrdersApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    effect(() => {
      const settings = this.publicStoreSettingsService.settings();
      this.checkoutState.setDeliveryFeeDefault(this.toNumber(settings.deliveryFeeDefault));
    });
  }

  /**
   * Inicializa contexto de rota para separar fluxo publico por pagina.
   */
  ngOnInit() {
    this.publicStoreSettingsService.ensureLoaded();
    this.bindRouteViewContext();
  }

  /**
   * Exposicao de configuracoes publicas da loja para fluxo cliente.
   */
  get storeSettings() {
    return this.publicStoreSettingsService.settings();
  }

  /**
   * Informa se loja esta aberta para receber pedidos.
   */
  get isStoreOpen() {
    return this.storeSettings.isStoreOpen;
  }

  /**
   * Retorna valor minimo de pedido definido pela operacao.
   */
  get minimumOrderAmount() {
    return this.toNumber(this.storeSettings.minimumOrderAmount);
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
   * Calcula total selecionado em extras no detalhe atual.
   */
  get selectedExtrasTotal() {
    const selectedIds = this.selectedExtraIds;

    return this.selectedProductExtras
      .filter((extra) => selectedIds.includes(extra.id))
      .reduce((sum, extra) => sum + this.toNumber(extra.price), 0);
  }

  /**
   * Retorna preco final configurado (base + extras selecionados).
   */
  get selectedProductConfiguredUnitPrice() {
    if (!this.selectedProduct) {
      return 0;
    }

    return this.selectedProduct.price + this.selectedExtrasTotal;
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
    return this.checkoutState.isSubmittingOrder();
  }

  /**
   * Exposicao de feedback operacional do checkout.
   */
  get orderFeedback() {
    return this.checkoutState.orderFeedback();
  }

  /**
   * Exposicao de feedback de validacao de cupom.
   */
  get couponFeedback() {
    return this.checkoutState.couponFeedback();
  }

  /**
   * Exposicao de estado de validacao de cupom.
   */
  get isValidatingCoupon() {
    return this.checkoutState.isValidatingCoupon();
  }

  /**
   * Retorna desconto validado para o cupom atualmente preenchido.
   */
  get validatedCouponDiscountAmount() {
    const feedback = this.couponFeedback;
    if (!feedback || feedback.type !== 'success') {
      return 0;
    }

    const normalizedCurrentCode = this.checkout.couponCode.trim().toUpperCase();
    if (!feedback.code || feedback.code !== normalizedCurrentCode) {
      return 0;
    }

    return feedback.discountAmount ?? 0;
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
    this.checkoutState.clearCouponFeedback();
  }

  /**
   * Abre detalhe do produto via rota canonica.
   *
   * Motivo:
   * manter o id na URL permite recarregar, compartilhar e retomar
   * o detalhe sem depender apenas de estado em memoria.
   */
  openProductDetails(product: Product) {
    void this.router.navigate(['/produto', product.id], {
      queryParams: this.buildCatalogQueryParams(),
    });
  }

  /**
   * Fecha detalhe e retorna para rota base de cardapio.
   */
  closeProductDetails() {
    this.catalogState.closeProductDetails();
    if (this.route.snapshot.paramMap.get('id')) {
      void this.router.navigate(['/cardapio'], {
        queryParams: this.buildCatalogQueryParams(),
      });
    }
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
    this.checkoutState.clearCouponFeedback();

    this.closeProductDetails();
  }

  /**
   * Ajusta quantidade de item no carrinho.
   */
  changeItemQuantity(itemKey: string, nextQuantity: number) {
    this.cartService.updateQuantity(itemKey, nextQuantity);
    this.checkoutState.clearCouponFeedback();
  }

  /**
   * Remove item do carrinho.
   */
  removeFromCart(itemKey: string) {
    this.cartService.removeItem(itemKey);
    this.checkoutState.clearCouponFeedback();
  }

  /**
   * Retorna total final (subtotal + taxa fixa de entrega local).
   */
  get orderTotal() {
    return this.cartSubtotal() + (this.checkout.deliveryFee || 0);
  }

  /**
   * Limpa feedback quando o operador altera o codigo manualmente.
   */
  onCouponCodeChanged() {
    this.checkoutState.clearCouponFeedback();
  }

  /**
   * Valida cupom no backend sem criar pedido.
   */
  validateCouponForCheckout() {
    const normalizedCode = this.checkout.couponCode.trim().toUpperCase();
    if (!normalizedCode) {
      this.checkoutState.setCouponFeedback({
        type: 'error',
        message: 'Informe um cupom para validar.',
      });
      return;
    }

    const rawPhone = this.checkout.whatsapp.trim();
    const normalizedPhone = rawPhone
      ? this.checkoutState.normalizePhoneForCheckout(rawPhone)
      : null;
    if (rawPhone.length > 0 && !normalizedPhone) {
      this.checkoutState.setCouponFeedback({
        type: 'error',
        message: 'Informe um telefone valido para validar o cupom.',
      });
      return;
    }

    this.checkoutState.setIsValidatingCoupon(true);
    this.checkoutState.setCouponFeedback(null);

    this.ordersApiService
      .validatePublicCoupon({
        code: normalizedCode,
        subtotal: this.cartSubtotal(),
        clientPhone: normalizedPhone || undefined,
      })
      .subscribe({
        next: (response) => {
          this.checkoutState.setIsValidatingCoupon(false);
          this.applyCouponValidationFeedback(response);
        },
        error: (error) => {
          this.checkoutState.setIsValidatingCoupon(false);
          const apiMessage =
            error?.error?.message && typeof error.error.message === 'string'
              ? error.error.message
              : 'Nao foi possivel validar o cupom agora.';
          this.checkoutState.setCouponFeedback({
            type: 'error',
            message: apiMessage,
          });
        },
      });
  }

  /**
   * Envia pedido para API usando estado do carrinho local.
   *
   * Observacao:
   * - cliente e deduplicado no backend pelo telefone informado;
   * - endereco segue como campo simplificado (`addressLine`) neste estagio.
   */
  submitOrder() {
    if (!this.isStoreOpen) {
      this.checkoutState.setOrderFeedback({
        type: 'error',
        message: 'Loja fechada no momento. Tente novamente no horario de atendimento.',
      });
      return;
    }

    if (this.cartItems().length === 0) {
      this.checkoutState.setOrderFeedback({
        type: 'error',
        message: 'Adicione itens no carrinho antes de finalizar.',
      });
      return;
    }

    if (this.minimumOrderAmount > 0 && this.cartSubtotal() < this.minimumOrderAmount) {
      this.checkoutState.setOrderFeedback({
        type: 'error',
        message: `Pedido minimo de R$ ${this.minimumOrderAmount.toFixed(2)} para finalizar.`,
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

          if (this.checkout.couponCode.trim().length > 0 && apiMessage.toLowerCase().includes('cupom')) {
            this.checkoutState.setCouponFeedback({
              type: 'error',
              message: apiMessage,
            });
          }
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
    const url = `https://wa.me/${this.supportWhatsAppPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Informa se ja existe contexto minimo para contato assistido.
   */
  get canContactWhatsApp() {
    return this.trackingData !== null || this.trackingOrderId.trim().length > 0;
  }

  /**
   * Resolve telefone de suporte para contato via WhatsApp.
   */
  get supportWhatsAppPhone() {
    const digitsOnly = (this.storeSettings.contactWhatsApp || '').replace(/\D/g, '');
    return digitsOnly.length >= 10 ? digitsOnly : this.fallbackStoreWhatsAppPhone;
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
          void this.syncProductDetailsFromRoute(paramMap.get('id'));
        } else {
          // Invalidamos sincronizacoes pendentes para evitar que um await
          // antigo reabra modal apos o usuario sair da rota de catalogo.
          this.productRouteSyncVersion += 1;
        }

        if (!this.isCatalogView && this.selectedProduct) {
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

  /**
   * Converte valores numericos vindos da API para numero seguro no front.
   */
  private toNumber(value: string | number | null | undefined) {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  /**
   * Converte retorno de validacao do backend para feedback visual.
   */
  private applyCouponValidationFeedback(response: ValidatePublicCouponResponse) {
    if (!response.valid) {
      this.checkoutState.setCouponFeedback({
        type: 'error',
        message: response.message,
        code: response.code,
      });
      return;
    }

    this.checkout.couponCode = response.code;
    const discountAmount = this.toNumber(response.discountAmount);
    this.checkoutState.setCouponFeedback({
      type: 'success',
      message: `${response.message}. Desconto previsto: R$ ${discountAmount.toFixed(2)}`,
      code: response.code,
      discountAmount,
    });
  }

  /**
   * Resolve query params de contexto para navegar entre cardapio e detalhe.
   */
  private buildCatalogQueryParams() {
    return this.selectedCategoryId
      ? this.getCatalogCategoryQueryParams(this.selectedCategoryId)
      : this.getCatalogCategoryQueryParams();
  }

  /**
   * Sincroniza rota `/produto/:id` com abertura do detalhe no estado local.
   */
  private async syncProductDetailsFromRoute(rawProductId: string | null) {
    const syncVersion = ++this.productRouteSyncVersion;
    await this.catalogState.ensureCatalogLoaded();

    if (syncVersion !== this.productRouteSyncVersion || !this.isCatalogView) {
      return;
    }

    if (!rawProductId) {
      this.catalogState.closeProductDetails();
      return;
    }

    const parsedProductId = Number(rawProductId);
    if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
      this.catalogState.closeProductDetails();
      await this.router.navigate(['/cardapio'], {
        queryParams: this.buildCatalogQueryParams(),
      });
      return;
    }

    const product =
      this.catalogProducts.find((catalogProduct) => catalogProduct.id === parsedProductId) ?? null;
    if (!product) {
      this.catalogState.closeProductDetails();
      await this.router.navigate(['/cardapio'], {
        queryParams: this.buildCatalogQueryParams(),
      });
      return;
    }

    if (this.selectedProduct?.id === product.id) {
      return;
    }

    this.catalogState.openProductDetails(product);
  }
}
