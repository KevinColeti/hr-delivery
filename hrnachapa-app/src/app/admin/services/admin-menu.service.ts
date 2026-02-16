import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface AdminMenuCategory {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminMenuCategoryPayload {
  name: string;
  slug: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateAdminMenuCategoryPayload {
  name?: string;
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface AdminMenuProductCategory {
  id: number;
  name: string;
  slug: string;
}

interface AdminMenuProductAvailabilityMissingIngredient {
  ingredientId: number;
  name: string;
  required: number;
  currentStock: number;
  unit: string;
}

interface AdminMenuProductAvailability {
  available: boolean;
  reason: string;
  missingIngredients: AdminMenuProductAvailabilityMissingIngredient[];
}

export interface AdminMenuProduct {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  categoryId: number;
  category: AdminMenuProductCategory;
  isActive: boolean;
  availability: AdminMenuProductAvailability;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminMenuProductPayload {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
  isActive?: boolean;
}

export interface UpdateAdminMenuProductPayload {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  categoryId?: number;
  isActive?: boolean;
}

export interface AdminMenuIngredient {
  id: number;
  name: string;
  unit: string;
  stockQuantity: string;
  minimumQuantity: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminMenuRecipeItemIngredient {
  id: number;
  name: string;
  unit: string;
  stockQuantity: string;
  minimumQuantity: string;
  isActive: boolean;
}

export interface AdminMenuRecipeItem {
  id: number;
  productId: number;
  ingredientId: number;
  quantity: string;
  unit: string;
  ingredient: AdminMenuRecipeItemIngredient;
}

export interface CreateAdminMenuRecipeItemPayload {
  ingredientId: number;
  quantity: number;
  unit?: string;
}

export interface UpdateAdminMenuRecipeItemPayload {
  quantity?: number;
  unit?: string;
}

interface AdminMenuExtraIngredient {
  id: number;
  name: string;
  unit: string;
  stockQuantity: string;
  minimumQuantity: string;
  isActive: boolean;
}

export interface AdminMenuProductExtra {
  id: number;
  productId: number;
  name: string;
  price: string;
  sortOrder: number;
  isActive: boolean;
  ingredientId: number | null;
  ingredientQuantity: string | null;
  ingredientUnit: string | null;
  ingredient: AdminMenuExtraIngredient | null;
}

export interface CreateAdminMenuProductExtraPayload {
  name: string;
  price: number;
  sortOrder?: number;
  isActive?: boolean;
  ingredientId?: number;
  ingredientQuantity?: number;
  ingredientUnit?: string;
}

export interface UpdateAdminMenuProductExtraPayload {
  name?: string;
  price?: number;
  sortOrder?: number;
  isActive?: boolean;
  ingredientId?: number | null;
  ingredientQuantity?: number;
  ingredientUnit?: string;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Adaptador HTTP do modulo de cardapio para o admin.
 *
 * Responsabilidades:
 * - CRUD de categorias e produtos;
 * - CRUD de receita por produto;
 * - CRUD de extras por produto;
 * - leitura de insumos para seletores de formularios.
 */
export class AdminMenuService {
  private readonly categoriesBaseUrl = 'http://localhost:3000/categories';
  private readonly productsBaseUrl = 'http://localhost:3000/products';
  private readonly ingredientsBaseUrl = 'http://localhost:3000/ingredients';

  /**
   * Injeta cliente HTTP para chamadas administrativas de cardapio.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Lista categorias.
   */
  listCategories() {
    return this.http.get<AdminMenuCategory[]>(this.categoriesBaseUrl);
  }

  /**
   * Busca categoria por identificador.
   */
  getCategoryById(categoryId: number) {
    return this.http.get<AdminMenuCategory>(`${this.categoriesBaseUrl}/${categoryId}`);
  }

  /**
   * Cria categoria.
   */
  createCategory(payload: CreateAdminMenuCategoryPayload) {
    return this.http.post<AdminMenuCategory>(this.categoriesBaseUrl, payload);
  }

  /**
   * Atualiza categoria.
   */
  updateCategory(categoryId: number, payload: UpdateAdminMenuCategoryPayload) {
    return this.http.patch<AdminMenuCategory>(`${this.categoriesBaseUrl}/${categoryId}`, payload);
  }

  /**
   * Remove categoria.
   */
  deleteCategory(categoryId: number) {
    return this.http.delete<{ success: boolean }>(`${this.categoriesBaseUrl}/${categoryId}`);
  }

  /**
   * Lista produtos.
   */
  listProducts() {
    return this.http.get<AdminMenuProduct[]>(this.productsBaseUrl);
  }

  /**
   * Busca produto por identificador.
   */
  getProductById(productId: number) {
    return this.http.get<AdminMenuProduct>(`${this.productsBaseUrl}/${productId}`);
  }

  /**
   * Cria produto.
   */
  createProduct(payload: CreateAdminMenuProductPayload) {
    return this.http.post<AdminMenuProduct>(this.productsBaseUrl, payload);
  }

  /**
   * Atualiza produto.
   */
  updateProduct(productId: number, payload: UpdateAdminMenuProductPayload) {
    return this.http.patch<AdminMenuProduct>(`${this.productsBaseUrl}/${productId}`, payload);
  }

  /**
   * Remove produto.
   */
  deleteProduct(productId: number) {
    return this.http.delete<{ success: boolean }>(`${this.productsBaseUrl}/${productId}`);
  }

  /**
   * Lista insumos para formularios de receita/extras.
   */
  listIngredients() {
    return this.http.get<AdminMenuIngredient[]>(this.ingredientsBaseUrl);
  }

  /**
   * Lista itens de receita de um produto.
   */
  listRecipeItems(productId: number) {
    return this.http.get<AdminMenuRecipeItem[]>(`${this.productsBaseUrl}/${productId}/ingredients`);
  }

  /**
   * Cria item de receita.
   */
  createRecipeItem(productId: number, payload: CreateAdminMenuRecipeItemPayload) {
    return this.http.post<AdminMenuRecipeItem>(
      `${this.productsBaseUrl}/${productId}/ingredients`,
      payload,
    );
  }

  /**
   * Atualiza item de receita.
   */
  updateRecipeItem(
    productId: number,
    recipeItemId: number,
    payload: UpdateAdminMenuRecipeItemPayload,
  ) {
    return this.http.patch<AdminMenuRecipeItem>(
      `${this.productsBaseUrl}/${productId}/ingredients/${recipeItemId}`,
      payload,
    );
  }

  /**
   * Remove item de receita.
   */
  deleteRecipeItem(productId: number, recipeItemId: number) {
    return this.http.delete<{ success: boolean }>(
      `${this.productsBaseUrl}/${productId}/ingredients/${recipeItemId}`,
    );
  }

  /**
   * Lista extras de um produto.
   */
  listProductExtras(productId: number) {
    return this.http.get<AdminMenuProductExtra[]>(`${this.productsBaseUrl}/${productId}/extras`);
  }

  /**
   * Cria extra de produto.
   */
  createProductExtra(productId: number, payload: CreateAdminMenuProductExtraPayload) {
    return this.http.post<AdminMenuProductExtra>(`${this.productsBaseUrl}/${productId}/extras`, payload);
  }

  /**
   * Atualiza extra de produto.
   */
  updateProductExtra(
    productId: number,
    extraId: number,
    payload: UpdateAdminMenuProductExtraPayload,
  ) {
    return this.http.patch<AdminMenuProductExtra>(
      `${this.productsBaseUrl}/${productId}/extras/${extraId}`,
      payload,
    );
  }

  /**
   * Remove extra de produto.
   */
  deleteProductExtra(productId: number, extraId: number) {
    return this.http.delete<{ success: boolean }>(`${this.productsBaseUrl}/${productId}/extras/${extraId}`);
  }
}
