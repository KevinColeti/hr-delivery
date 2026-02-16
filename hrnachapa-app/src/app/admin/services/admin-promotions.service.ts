import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export type AdminPromotionDiscountType = 'fixed' | 'percentage';
export type AdminComboRuleType = 'product' | 'category';

export interface AdminCoupon {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discountType: AdminPromotionDiscountType;
  discountValue: string;
  minimumOrderAmount: string;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  firstOrderOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminCouponPayload {
  code: string;
  name: string;
  description?: string;
  discountType: AdminPromotionDiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  usageLimit?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
  firstOrderOnly?: boolean;
}

export interface UpdateAdminCouponPayload {
  code?: string;
  name?: string;
  description?: string;
  discountType?: AdminPromotionDiscountType;
  discountValue?: number;
  minimumOrderAmount?: number;
  usageLimit?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  firstOrderOnly?: boolean;
}

export interface AdminComboRule {
  id: number;
  comboId: number;
  type: AdminComboRuleType;
  productId: number | null;
  categoryId: number | null;
  minimumQuantity: number;
}

export interface AdminCombo {
  id: number;
  name: string;
  description: string | null;
  discountType: AdminPromotionDiscountType;
  discountValue: string;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  rules: AdminComboRule[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminComboPayload {
  name: string;
  description?: string;
  discountType: AdminPromotionDiscountType;
  discountValue: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export interface UpdateAdminComboPayload {
  name?: string;
  description?: string;
  discountType?: AdminPromotionDiscountType;
  discountValue?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
}

export interface CreateAdminComboRulePayload {
  type: AdminComboRuleType;
  productId?: number;
  categoryId?: number;
  minimumQuantity: number;
}

export interface UpdateAdminComboRulePayload {
  type?: AdminComboRuleType;
  productId?: number | null;
  categoryId?: number | null;
  minimumQuantity?: number;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Adaptador HTTP do modulo de promocoes do painel administrativo.
 *
 * Responsabilidades:
 * - concentrar o CRUD de cupons;
 * - concentrar o CRUD de combos;
 * - concentrar o CRUD de regras de combo.
 */
export class AdminPromotionsService {
  private readonly couponsBaseUrl = 'http://localhost:3000/coupons';
  private readonly combosBaseUrl = 'http://localhost:3000/combos';

  /**
   * Injeta cliente HTTP para consumo dos endpoints administrativos.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Lista todos os cupons cadastrados.
   */
  listCoupons() {
    return this.http.get<AdminCoupon[]>(this.couponsBaseUrl);
  }

  /**
   * Busca um cupom por identificador.
   */
  getCouponById(couponId: number) {
    return this.http.get<AdminCoupon>(`${this.couponsBaseUrl}/${couponId}`);
  }

  /**
   * Cria um novo cupom promocional.
   */
  createCoupon(payload: CreateAdminCouponPayload) {
    return this.http.post<AdminCoupon>(this.couponsBaseUrl, payload);
  }

  /**
   * Atualiza um cupom promocional existente.
   */
  updateCoupon(couponId: number, payload: UpdateAdminCouponPayload) {
    return this.http.patch<AdminCoupon>(`${this.couponsBaseUrl}/${couponId}`, payload);
  }

  /**
   * Remove um cupom do cadastro.
   */
  deleteCoupon(couponId: number) {
    return this.http.delete<{ success: boolean }>(`${this.couponsBaseUrl}/${couponId}`);
  }

  /**
   * Lista todos os combos cadastrados.
   */
  listCombos() {
    return this.http.get<AdminCombo[]>(this.combosBaseUrl);
  }

  /**
   * Busca um combo por identificador.
   */
  getComboById(comboId: number) {
    return this.http.get<AdminCombo>(`${this.combosBaseUrl}/${comboId}`);
  }

  /**
   * Cria um novo combo automatico.
   */
  createCombo(payload: CreateAdminComboPayload) {
    return this.http.post<AdminCombo>(this.combosBaseUrl, payload);
  }

  /**
   * Atualiza um combo automatico existente.
   */
  updateCombo(comboId: number, payload: UpdateAdminComboPayload) {
    return this.http.patch<AdminCombo>(`${this.combosBaseUrl}/${comboId}`, payload);
  }

  /**
   * Remove um combo automatico.
   */
  deleteCombo(comboId: number) {
    return this.http.delete<{ success: boolean }>(`${this.combosBaseUrl}/${comboId}`);
  }

  /**
   * Lista regras associadas a um combo.
   */
  listComboRules(comboId: number) {
    return this.http.get<AdminComboRule[]>(`${this.combosBaseUrl}/${comboId}/rules`);
  }

  /**
   * Busca uma regra especifica do combo.
   */
  getComboRuleById(comboId: number, ruleId: number) {
    return this.http.get<AdminComboRule>(`${this.combosBaseUrl}/${comboId}/rules/${ruleId}`);
  }

  /**
   * Cria uma nova regra para o combo informado.
   */
  createComboRule(comboId: number, payload: CreateAdminComboRulePayload) {
    return this.http.post<AdminComboRule>(`${this.combosBaseUrl}/${comboId}/rules`, payload);
  }

  /**
   * Atualiza uma regra existente do combo.
   */
  updateComboRule(comboId: number, ruleId: number, payload: UpdateAdminComboRulePayload) {
    return this.http.patch<AdminComboRule>(`${this.combosBaseUrl}/${comboId}/rules/${ruleId}`, payload);
  }

  /**
   * Remove uma regra do combo.
   */
  deleteComboRule(comboId: number, ruleId: number) {
    return this.http.delete<{ success: boolean }>(`${this.combosBaseUrl}/${comboId}/rules/${ruleId}`);
  }
}
