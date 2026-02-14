import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin } from 'rxjs';

export interface PublicCatalogCategoryResponse {
  id: number;
  name: string;
  slug: string;
}

interface PublicCatalogProductCategoryResponse {
  id: number;
  name: string;
  slug: string;
}

interface PublicCatalogAvailabilityResponse {
  available: boolean;
}

export interface PublicCatalogProductResponse {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  category: PublicCatalogProductCategoryResponse;
  availability: PublicCatalogAvailabilityResponse;
}

export interface PublicCatalogProductExtraResponse {
  id: number;
  productId: number;
  name: string;
  price: string;
  sortOrder: number;
  available: boolean;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Adaptador HTTP para leitura publica do catalogo.
 */
export class CatalogApiService {
  private readonly categoriesUrl = 'http://localhost:3000/categories/public/catalog';
  private readonly productsUrl = 'http://localhost:3000/products/public/catalog';

  constructor(private readonly http: HttpClient) {}

  /**
   * Carrega categorias e produtos em paralelo para reduzir tempo de tela.
   */
  getPublicCatalog() {
    return forkJoin({
      categories: this.http.get<PublicCatalogCategoryResponse[]>(this.categoriesUrl),
      products: this.http.get<PublicCatalogProductResponse[]>(this.productsUrl),
    });
  }

  /**
   * Lista extras publicos de um produto.
   */
  getProductPublicExtras(productId: number) {
    return this.http.get<PublicCatalogProductExtraResponse[]>(
      `http://localhost:3000/products/${productId}/extras/public/catalog`,
    );
  }
}
