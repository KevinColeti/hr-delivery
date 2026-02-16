import { Injectable, signal } from '@angular/core';
import { Product } from '../components/product-card/product-card';
import { categories as mockCategories, products as mockProducts } from '../data/products';
import {
  CatalogApiService,
  PublicCatalogCategoryResponse,
  PublicCatalogProductExtraResponse,
  PublicCatalogProductResponse,
} from './catalog-api.service';
import { CartItemExtraSelection } from './cart.service';

interface CatalogCategoryViewModel {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Estado de dominio do catalogo publico.
 *
 * Responsabilidades:
 * - manter vitrine, destaque e estados de carregamento/erro;
 * - manter contexto de configuracao de produto (extras + observacao);
 * - encapsular fallback para dados mock quando API estiver indisponivel.
 */
export class CatalogStateService {
  private readonly defaultProductImage =
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop';
  private readonly categoriesSignal = signal<CatalogCategoryViewModel[]>(mockCategories);
  private readonly catalogProductsSignal = signal<Product[]>(mockProducts);
  private readonly featuredItemsSignal = signal<Product[]>(mockProducts.slice(0, 3));
  private readonly isCatalogLoadingSignal = signal(false);
  private readonly catalogLoadErrorSignal = signal('');
  private readonly selectedProductSignal = signal<Product | null>(null);
  private readonly productDetailsLoadingSignal = signal(false);
  private readonly productDetailsErrorSignal = signal('');
  private readonly selectedProductExtrasSignal = signal<PublicCatalogProductExtraResponse[]>([]);
  private readonly selectedExtraIdsSignal = signal<number[]>([]);
  private readonly productObservationSignal = signal('');
  private hasLoadedCatalogSuccessfully = false;
  private catalogLoadInFlight: Promise<void> | null = null;

  readonly categories = this.categoriesSignal.asReadonly();
  readonly catalogProducts = this.catalogProductsSignal.asReadonly();
  readonly featuredItems = this.featuredItemsSignal.asReadonly();
  readonly isCatalogLoading = this.isCatalogLoadingSignal.asReadonly();
  readonly catalogLoadError = this.catalogLoadErrorSignal.asReadonly();
  readonly selectedProduct = this.selectedProductSignal.asReadonly();
  readonly productDetailsLoading = this.productDetailsLoadingSignal.asReadonly();
  readonly productDetailsError = this.productDetailsErrorSignal.asReadonly();
  readonly selectedProductExtras = this.selectedProductExtrasSignal.asReadonly();
  readonly selectedExtraIds = this.selectedExtraIdsSignal.asReadonly();
  readonly productObservation = this.productObservationSignal.asReadonly();

  /**
   * Injeta adaptador HTTP usado para ler catalogo e extras publicos.
   */
  constructor(private readonly catalogApiService: CatalogApiService) {}

  /**
   * Garante carga inicial do catalogo uma unica vez por sessao.
   *
   * Retorna `Promise<void>` para permitir que fluxos guiados por rota
   * aguardem a lista de produtos antes de resolver detalhes por id.
   */
  ensureCatalogLoaded() {
    if (this.hasLoadedCatalogSuccessfully || this.isCatalogLoadingSignal()) {
      return this.catalogLoadInFlight ?? Promise.resolve();
    }

    if (this.catalogLoadInFlight) {
      return this.catalogLoadInFlight;
    }

    this.catalogLoadInFlight = new Promise((resolve) => {
      this.loadPublicCatalog(() => {
        this.catalogLoadInFlight = null;
        resolve();
      });
    });

    return this.catalogLoadInFlight;
  }

  /**
   * Filtra produtos da vitrine por categoria.
   */
  getProductsByCategory(categoryId: string): Product[] {
    return this.catalogProductsSignal().filter((product) => product.category === categoryId);
  }

  /**
   * Abre configuracao de produto e carrega extras publicos.
   */
  openProductDetails(product: Product) {
    // Reiniciamos o estado antes da consulta para impedir que o modal
    // mostre dados residuais de um produto anterior enquanto carrega.
    this.selectedProductSignal.set(product);
    this.selectedProductExtrasSignal.set([]);
    this.selectedExtraIdsSignal.set([]);
    this.productObservationSignal.set('');
    this.productDetailsErrorSignal.set('');
    this.productDetailsLoadingSignal.set(true);

    this.catalogApiService.getProductPublicExtras(product.id).subscribe({
      next: (extras) => {
        this.productDetailsLoadingSignal.set(false);
        this.selectedProductExtrasSignal.set(extras);
      },
      error: () => {
        this.productDetailsLoadingSignal.set(false);
        this.selectedProductExtrasSignal.set([]);
        this.productDetailsErrorSignal.set('Nao foi possivel carregar os extras deste produto.');
      },
    });
  }

  /**
   * Fecha configuracao de produto limpando estado temporario.
   */
  closeProductDetails() {
    this.selectedProductSignal.set(null);
    this.selectedProductExtrasSignal.set([]);
    this.selectedExtraIdsSignal.set([]);
    this.productObservationSignal.set('');
    this.productDetailsErrorSignal.set('');
    this.productDetailsLoadingSignal.set(false);
  }

  /**
   * Atualiza selecao de extras do produto em configuracao.
   */
  toggleExtraSelection(extraId: number, checked: boolean) {
    if (checked) {
      this.selectedExtraIdsSignal.set([...this.selectedExtraIdsSignal(), extraId]);
      return;
    }

    this.selectedExtraIdsSignal.set(
      this.selectedExtraIdsSignal().filter((selectedId) => selectedId !== extraId),
    );
  }

  /**
   * Atualiza observacao textual do produto em configuracao.
   */
  setProductObservation(nextValue: string) {
    this.productObservationSignal.set(nextValue);
  }

  /**
   * Converte selecao de extras para formato estruturado do carrinho.
   */
  buildSelectedExtraSelections(): CartItemExtraSelection[] {
    const selectedIds = this.selectedExtraIdsSignal();
    return this.selectedProductExtrasSignal()
      .filter((extra) => selectedIds.includes(extra.id))
      .map((extra) => ({
        extraId: extra.id,
        name: extra.name,
        quantity: 1,
      }))
      .sort((left, right) => left.extraId - right.extraId);
  }

  /**
   * Carrega catalogo publico com fallback local.
   *
   * Motivo:
   * em ambiente local o backend pode oscilar; manter fallback evita
   * interromper a navegacao de vitrine durante desenvolvimento.
   */
  private loadPublicCatalog(onComplete: () => void) {
    this.isCatalogLoadingSignal.set(true);
    this.catalogLoadErrorSignal.set('');

    this.catalogApiService.getPublicCatalog().subscribe({
      next: (response) => {
        this.hasLoadedCatalogSuccessfully = true;
        this.isCatalogLoadingSignal.set(false);
        this.categoriesSignal.set(
          response.categories.map((category) => this.mapCategoryFromApi(category)),
        );
        this.catalogProductsSignal.set(
          response.products.map((product) => this.mapProductFromApi(product)),
        );
        this.featuredItemsSignal.set(this.catalogProductsSignal().slice(0, 3));
        onComplete();
      },
      error: () => {
        this.hasLoadedCatalogSuccessfully = false;
        this.isCatalogLoadingSignal.set(false);
        this.categoriesSignal.set(mockCategories);
        this.catalogProductsSignal.set(mockProducts);
        this.featuredItemsSignal.set(mockProducts.slice(0, 3));
        this.catalogLoadErrorSignal.set(
          'Catalogo indisponivel no momento. Exibindo vitrine local temporaria.',
        );
        onComplete();
      },
    });
  }

  /**
   * Normaliza categoria da API para modelo visual do frontend.
   */
  private mapCategoryFromApi(category: PublicCatalogCategoryResponse): CatalogCategoryViewModel {
    return {
      id: category.slug,
      name: category.name,
    };
  }

  /**
   * Normaliza produto da API para modelo visual do frontend.
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
