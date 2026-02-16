import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface AdminStockIngredient {
  id: number;
  name: string;
  unit: string;
  stockQuantity: string;
  minimumQuantity: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdminStockAlertLevel = 'below_minimum' | 'out_of_stock';
export type AdminStockMovementType = 'entry' | 'exit' | 'adjustment';
export type AdminStockMovementSource = 'manual' | 'order_confirmation';

export interface AdminStockLowStockAlert {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  isActive: boolean;
  stockQuantity: string;
  minimumQuantity: string;
  deficitQuantity: string;
  alertLevel: AdminStockAlertLevel;
}

export interface CreateAdminStockIngredientPayload {
  name: string;
  unit: string;
  stockQuantity?: number;
  minimumQuantity?: number;
  isActive?: boolean;
}

export interface UpdateAdminStockIngredientPayload {
  name?: string;
  unit?: string;
  stockQuantity?: number;
  minimumQuantity?: number;
  isActive?: boolean;
}

interface AdminStockMovementIngredient {
  id: number;
  name: string;
  unit: string;
}

interface AdminStockMovementOrder {
  id: number;
  status: string;
}

export interface AdminStockMovement {
  id: number;
  ingredientId: number;
  ingredient: AdminStockMovementIngredient;
  orderId: number | null;
  order: AdminStockMovementOrder | null;
  type: AdminStockMovementType;
  source: AdminStockMovementSource;
  quantityChange: string;
  stockBefore: string;
  stockAfter: string;
  reason: string;
  notes: string | null;
  createdAt: string;
}

export interface CreateAdminStockMovementPayload {
  ingredientId: number;
  type: AdminStockMovementType;
  quantity?: number;
  targetQuantity?: number;
  reason: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Adaptador HTTP do modulo de estoque no admin.
 *
 * Responsabilidades:
 * - CRUD de insumos;
 * - consulta de alertas de estoque minimo.
 */
export class AdminStockService {
  private readonly ingredientsBaseUrl = 'http://localhost:3000/ingredients';
  private readonly stockMovementsBaseUrl = 'http://localhost:3000/stock-movements';

  /**
   * Injeta cliente HTTP para chamadas administrativas de estoque.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Lista insumos ordenados por nome.
   */
  listIngredients() {
    return this.http.get<AdminStockIngredient[]>(this.ingredientsBaseUrl);
  }

  /**
   * Busca um insumo por identificador.
   */
  getIngredientById(ingredientId: number) {
    return this.http.get<AdminStockIngredient>(`${this.ingredientsBaseUrl}/${ingredientId}`);
  }

  /**
   * Cria um novo insumo.
   */
  createIngredient(payload: CreateAdminStockIngredientPayload) {
    return this.http.post<AdminStockIngredient>(this.ingredientsBaseUrl, payload);
  }

  /**
   * Atualiza insumo existente.
   */
  updateIngredient(ingredientId: number, payload: UpdateAdminStockIngredientPayload) {
    return this.http.patch<AdminStockIngredient>(`${this.ingredientsBaseUrl}/${ingredientId}`, payload);
  }

  /**
   * Remove insumo.
   */
  deleteIngredient(ingredientId: number) {
    return this.http.delete<{ success: boolean }>(`${this.ingredientsBaseUrl}/${ingredientId}`);
  }

  /**
   * Lista alertas de estoque minimo.
   */
  listLowStockAlerts(params?: { includeInactive?: boolean; limit?: number }) {
    let queryParams = new HttpParams();
    if (params?.includeInactive !== undefined) {
      queryParams = queryParams.set('includeInactive', String(params.includeInactive));
    }
    if (params?.limit !== undefined) {
      queryParams = queryParams.set('limit', String(params.limit));
    }

    return this.http.get<AdminStockLowStockAlert[]>(`${this.ingredientsBaseUrl}/alerts/minimum`, {
      params: queryParams,
    });
  }

  /**
   * Lista movimentacoes de estoque com filtros opcionais.
   */
  listStockMovements(params?: {
    ingredientId?: number;
    type?: AdminStockMovementType;
    source?: AdminStockMovementSource;
    orderId?: number;
    limit?: number;
  }) {
    let queryParams = new HttpParams();
    if (params?.ingredientId !== undefined) {
      queryParams = queryParams.set('ingredientId', String(params.ingredientId));
    }
    if (params?.type !== undefined) {
      queryParams = queryParams.set('type', params.type);
    }
    if (params?.source !== undefined) {
      queryParams = queryParams.set('source', params.source);
    }
    if (params?.orderId !== undefined) {
      queryParams = queryParams.set('orderId', String(params.orderId));
    }
    if (params?.limit !== undefined) {
      queryParams = queryParams.set('limit', String(params.limit));
    }

    return this.http.get<AdminStockMovement[]>(this.stockMovementsBaseUrl, {
      params: queryParams,
    });
  }

  /**
   * Cria movimentacao manual de estoque.
   */
  createStockMovement(payload: CreateAdminStockMovementPayload) {
    return this.http.post<AdminStockMovement>(this.stockMovementsBaseUrl, payload);
  }
}
