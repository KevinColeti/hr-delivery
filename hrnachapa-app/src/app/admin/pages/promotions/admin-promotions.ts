import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminCombo,
  AdminComboRule,
  AdminComboRuleType,
  AdminCoupon,
  AdminPromotionDiscountType,
  AdminPromotionsService,
  CreateAdminComboPayload,
  CreateAdminComboRulePayload,
  CreateAdminCouponPayload,
  UpdateAdminComboPayload,
  UpdateAdminComboRulePayload,
  UpdateAdminCouponPayload,
} from '../../services/admin-promotions.service';

interface CouponFormModel {
  code: string;
  name: string;
  description: string;
  discountType: AdminPromotionDiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  usageLimit: number | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  firstOrderOnly: boolean;
}

interface ComboFormModel {
  name: string;
  description: string;
  discountType: AdminPromotionDiscountType;
  discountValue: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

interface ComboRuleFormModel {
  type: AdminComboRuleType;
  productId: number | null;
  categoryId: number | null;
  minimumQuantity: number;
}

@Component({
  selector: 'app-admin-promotions',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-promotions.html',
  styleUrl: './admin-promotions.css',
})
/**
 * Modulo de promocoes do painel administrativo.
 *
 * Responsabilidades:
 * - listar, criar, editar e remover cupons;
 * - listar, criar, editar e remover combos;
 * - listar, criar, editar e remover regras de combo.
 */
export class AdminPromotionsComponent implements OnInit {
  readonly discountTypeOptions: AdminPromotionDiscountType[] = ['fixed', 'percentage'];
  readonly comboRuleTypeOptions: AdminComboRuleType[] = ['product', 'category'];

  coupons: AdminCoupon[] = [];
  combos: AdminCombo[] = [];
  comboRules: AdminComboRule[] = [];

  selectedCoupon: AdminCoupon | null = null;
  selectedCombo: AdminCombo | null = null;
  selectedComboRule: AdminComboRule | null = null;

  couponForm: CouponFormModel = this.createEmptyCouponForm();
  comboForm: ComboFormModel = this.createEmptyComboForm();
  comboRuleForm: ComboRuleFormModel = this.createEmptyComboRuleForm();

  isLoadingCoupons = false;
  isLoadingCombos = false;
  isLoadingComboRules = false;

  isSavingCoupon = false;
  isSavingCombo = false;
  isSavingComboRule = false;

  couponErrorMessage = '';
  comboErrorMessage = '';
  comboRuleErrorMessage = '';

  couponSuccessMessage = '';
  comboSuccessMessage = '';
  comboRuleSuccessMessage = '';

  /**
   * Injeta adaptador HTTP de promocoes e detector para sincronizar UI.
   */
  constructor(
    private readonly adminPromotionsService: AdminPromotionsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  /**
   * Carrega dados iniciais de cupons e combos quando a pagina inicia.
   */
  ngOnInit() {
    this.loadCoupons(false);
    this.loadCombos(false);
  }

  /**
   * Recarrega lista de cupons preservando selecao atual quando possivel.
   */
  loadCoupons(preserveSelection: boolean) {
    this.isLoadingCoupons = true;
    this.couponErrorMessage = '';

    this.adminPromotionsService.listCoupons().subscribe({
      next: (coupons) => {
        this.isLoadingCoupons = false;
        this.coupons = coupons;
        this.syncCouponSelection(preserveSelection);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingCoupons = false;
        this.couponErrorMessage = this.resolveErrorMessage(
          error,
          'Nao foi possivel carregar os cupons.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Recarrega lista de combos preservando selecao atual quando possivel.
   */
  loadCombos(preserveSelection: boolean) {
    this.isLoadingCombos = true;
    this.comboErrorMessage = '';

    this.adminPromotionsService.listCombos().subscribe({
      next: (combos) => {
        this.isLoadingCombos = false;
        this.combos = combos;
        this.syncComboSelection(preserveSelection);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingCombos = false;
        this.comboErrorMessage = this.resolveErrorMessage(
          error,
          'Nao foi possivel carregar os combos.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Seleciona cupom da lista e preenche formulario de edicao.
   */
  selectCoupon(couponId: number) {
    const selectedCoupon = this.coupons.find((coupon) => coupon.id === couponId) ?? null;
    this.applyCouponSelection(selectedCoupon);
  }

  /**
   * Limpa selecao de cupom para abrir formulario de criacao.
   */
  startNewCoupon() {
    this.selectedCoupon = null;
    this.couponForm = this.createEmptyCouponForm();
    this.couponErrorMessage = '';
    this.couponSuccessMessage = '';
  }

  /**
   * Persiste formulario de cupom como criacao ou atualizacao.
   */
  saveCoupon() {
    this.isSavingCoupon = true;
    this.couponErrorMessage = '';
    this.couponSuccessMessage = '';

    if (this.selectedCoupon) {
      const payload = this.buildUpdateCouponPayload(this.selectedCoupon);
      this.adminPromotionsService.updateCoupon(this.selectedCoupon.id, payload).subscribe({
        next: (coupon) => {
          this.isSavingCoupon = false;
          this.selectedCoupon = coupon;
          this.couponSuccessMessage = 'Cupom atualizado com sucesso.';
          this.loadCoupons(true);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isSavingCoupon = false;
          this.couponErrorMessage = this.resolveErrorMessage(
            error,
            'Falha ao atualizar cupom.',
          );
          this.cdr.detectChanges();
        },
      });
      return;
    }

    const payload = this.buildCreateCouponPayload();
    this.adminPromotionsService.createCoupon(payload).subscribe({
      next: (coupon) => {
        this.isSavingCoupon = false;
        this.selectedCoupon = coupon;
        this.couponSuccessMessage = 'Cupom criado com sucesso.';
        this.loadCoupons(true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingCoupon = false;
        this.couponErrorMessage = this.resolveErrorMessage(error, 'Falha ao criar cupom.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Remove cupom selecionado apos confirmacao do operador.
   */
  deleteSelectedCoupon() {
    if (!this.selectedCoupon) {
      return;
    }

    const coupon = this.selectedCoupon;
    const confirmed = window.confirm(`Deseja remover o cupom "${coupon.code}"?`);
    if (!confirmed) {
      return;
    }

    this.isSavingCoupon = true;
    this.couponErrorMessage = '';
    this.couponSuccessMessage = '';

    this.adminPromotionsService.deleteCoupon(coupon.id).subscribe({
      next: () => {
        this.isSavingCoupon = false;
        this.selectedCoupon = null;
        this.couponForm = this.createEmptyCouponForm();
        this.couponSuccessMessage = 'Cupom removido com sucesso.';
        this.loadCoupons(true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingCoupon = false;
        this.couponErrorMessage = this.resolveErrorMessage(error, 'Falha ao remover cupom.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Seleciona combo da lista e carrega regras vinculadas.
   */
  selectCombo(comboId: number) {
    const selectedCombo = this.combos.find((combo) => combo.id === comboId) ?? null;
    this.applyComboSelection(selectedCombo);
  }

  /**
   * Limpa selecao de combo para abrir formulario de criacao.
   */
  startNewCombo() {
    this.selectedCombo = null;
    this.comboForm = this.createEmptyComboForm();
    this.comboRules = [];
    this.selectedComboRule = null;
    this.comboRuleForm = this.createEmptyComboRuleForm();
    this.comboErrorMessage = '';
    this.comboSuccessMessage = '';
    this.comboRuleErrorMessage = '';
    this.comboRuleSuccessMessage = '';
  }

  /**
   * Persiste formulario de combo como criacao ou atualizacao.
   */
  saveCombo() {
    this.isSavingCombo = true;
    this.comboErrorMessage = '';
    this.comboSuccessMessage = '';

    if (this.selectedCombo) {
      const payload = this.buildUpdateComboPayload(this.selectedCombo);
      this.adminPromotionsService.updateCombo(this.selectedCombo.id, payload).subscribe({
        next: (combo) => {
          this.isSavingCombo = false;
          this.selectedCombo = combo;
          this.comboSuccessMessage = 'Combo atualizado com sucesso.';
          this.loadCombos(true);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isSavingCombo = false;
          this.comboErrorMessage = this.resolveErrorMessage(
            error,
            'Falha ao atualizar combo.',
          );
          this.cdr.detectChanges();
        },
      });
      return;
    }

    const payload = this.buildCreateComboPayload();
    this.adminPromotionsService.createCombo(payload).subscribe({
      next: (combo) => {
        this.isSavingCombo = false;
        this.selectedCombo = combo;
        this.comboSuccessMessage = 'Combo criado com sucesso.';
        this.loadCombos(true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingCombo = false;
        this.comboErrorMessage = this.resolveErrorMessage(error, 'Falha ao criar combo.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Remove combo selecionado apos confirmacao do operador.
   */
  deleteSelectedCombo() {
    if (!this.selectedCombo) {
      return;
    }

    const combo = this.selectedCombo;
    const confirmed = window.confirm(`Deseja remover o combo "${combo.name}"?`);
    if (!confirmed) {
      return;
    }

    this.isSavingCombo = true;
    this.comboErrorMessage = '';
    this.comboSuccessMessage = '';

    this.adminPromotionsService.deleteCombo(combo.id).subscribe({
      next: () => {
        this.isSavingCombo = false;
        this.selectedCombo = null;
        this.comboForm = this.createEmptyComboForm();
        this.comboRules = [];
        this.selectedComboRule = null;
        this.comboRuleForm = this.createEmptyComboRuleForm();
        this.comboSuccessMessage = 'Combo removido com sucesso.';
        this.loadCombos(true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingCombo = false;
        this.comboErrorMessage = this.resolveErrorMessage(error, 'Falha ao remover combo.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Recarrega regras do combo selecionado.
   */
  loadSelectedComboRules() {
    if (!this.selectedCombo) {
      return;
    }

    this.loadComboRules(this.selectedCombo.id, true);
  }

  /**
   * Seleciona regra do combo atual para edicao.
   */
  selectComboRule(ruleId: number) {
    const selectedRule = this.comboRules.find((rule) => rule.id === ruleId) ?? null;
    this.applyComboRuleSelection(selectedRule);
  }

  /**
   * Limpa selecao de regra para criacao de uma nova regra no combo atual.
   */
  startNewComboRule() {
    this.selectedComboRule = null;
    this.comboRuleForm = this.createEmptyComboRuleForm();
    this.comboRuleErrorMessage = '';
    this.comboRuleSuccessMessage = '';
  }

  /**
   * Persiste formulario de regra no combo selecionado.
   */
  saveComboRule() {
    if (!this.selectedCombo) {
      this.comboRuleErrorMessage = 'Selecione um combo antes de criar regras.';
      return;
    }
    const selectedComboId = this.selectedCombo.id;

    this.isSavingComboRule = true;
    this.comboRuleErrorMessage = '';
    this.comboRuleSuccessMessage = '';

    if (this.selectedComboRule) {
      const updatePayload = this.buildUpdateComboRulePayload();
      if (!updatePayload) {
        this.isSavingComboRule = false;
        this.cdr.detectChanges();
        return;
      }

      this.adminPromotionsService
        .updateComboRule(selectedComboId, this.selectedComboRule.id, updatePayload)
        .subscribe({
          next: () => {
            this.isSavingComboRule = false;
            this.comboRuleSuccessMessage = 'Regra atualizada com sucesso.';
            this.loadComboRules(selectedComboId, true);
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.isSavingComboRule = false;
            this.comboRuleErrorMessage = this.resolveErrorMessage(
              error,
              'Falha ao atualizar regra.',
            );
            this.cdr.detectChanges();
          },
        });
      return;
    }

    const createPayload = this.buildCreateComboRulePayload();
    if (!createPayload) {
      this.isSavingComboRule = false;
      this.cdr.detectChanges();
      return;
    }

    this.adminPromotionsService.createComboRule(selectedComboId, createPayload).subscribe({
      next: () => {
        this.isSavingComboRule = false;
        this.comboRuleSuccessMessage = 'Regra criada com sucesso.';
        this.loadComboRules(selectedComboId, false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingComboRule = false;
        this.comboRuleErrorMessage = this.resolveErrorMessage(error, 'Falha ao criar regra.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Remove regra selecionada do combo atual apos confirmacao.
   */
  deleteSelectedComboRule() {
    if (!this.selectedCombo || !this.selectedComboRule) {
      return;
    }

    const selectedCombo = this.selectedCombo;
    const selectedRule = this.selectedComboRule;
    const confirmed = window.confirm('Deseja remover a regra selecionada deste combo?');
    if (!confirmed) {
      return;
    }

    this.isSavingComboRule = true;
    this.comboRuleErrorMessage = '';
    this.comboRuleSuccessMessage = '';

    this.adminPromotionsService.deleteComboRule(selectedCombo.id, selectedRule.id).subscribe({
      next: () => {
        this.isSavingComboRule = false;
        this.comboRuleSuccessMessage = 'Regra removida com sucesso.';
        this.loadComboRules(selectedCombo.id, false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingComboRule = false;
        this.comboRuleErrorMessage = this.resolveErrorMessage(error, 'Falha ao remover regra.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Traduz tipo de desconto para rotulo legivel na interface.
   */
  getDiscountTypeLabel(discountType: AdminPromotionDiscountType) {
    return discountType === 'percentage' ? 'Percentual' : 'Valor fixo';
  }

  /**
   * Traduz tipo da regra de combo para rotulo legivel.
   */
  getComboRuleTypeLabel(ruleType: AdminComboRuleType) {
    return ruleType === 'product' ? 'Produto' : 'Categoria';
  }

  /**
   * Retorna rotulo com alvo da regra para exibicao na lista.
   */
  getComboRuleTargetLabel(rule: AdminComboRule) {
    if (rule.type === 'product') {
      return `Produto #${rule.productId ?? '-'}`;
    }

    return `Categoria #${rule.categoryId ?? '-'}`;
  }

  /**
   * Converte decimal string para numero seguro no template.
   */
  toNumber(value: string | number | null | undefined) {
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
   * Define classes visuais para badge ativo/inativo.
   */
  getActivationBadgeClass(isActive: boolean) {
    return isActive
      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      : 'bg-stone-200 text-stone-700 border border-stone-300';
  }

  /**
   * Sincroniza selecao de cupom apos recarregar a lista.
   */
  private syncCouponSelection(preserveSelection: boolean) {
    if (preserveSelection && this.selectedCoupon) {
      const selectedFromList =
        this.coupons.find((coupon) => coupon.id === this.selectedCoupon?.id) ?? null;
      this.applyCouponSelection(selectedFromList);
      return;
    }

    if (preserveSelection) {
      return;
    }

    const firstCoupon = this.coupons[0] ?? null;
    this.applyCouponSelection(firstCoupon);
  }

  /**
   * Aplica selecao de cupom e prepara formulario correspondente.
   */
  private applyCouponSelection(coupon: AdminCoupon | null) {
    this.selectedCoupon = coupon;
    this.couponForm = coupon ? this.mapCouponToForm(coupon) : this.createEmptyCouponForm();
    this.couponErrorMessage = '';
    this.couponSuccessMessage = '';
  }

  /**
   * Sincroniza selecao de combo apos recarregar a lista.
   */
  private syncComboSelection(preserveSelection: boolean) {
    if (preserveSelection && this.selectedCombo) {
      const selectedFromList = this.combos.find((combo) => combo.id === this.selectedCombo?.id) ?? null;
      this.applyComboSelection(selectedFromList);
      return;
    }

    if (preserveSelection) {
      return;
    }

    const firstCombo = this.combos[0] ?? null;
    this.applyComboSelection(firstCombo);
  }

  /**
   * Aplica selecao de combo, prepara formulario e carrega regras.
   */
  private applyComboSelection(combo: AdminCombo | null) {
    this.selectedCombo = combo;
    this.comboForm = combo ? this.mapComboToForm(combo) : this.createEmptyComboForm();
    this.selectedComboRule = null;
    this.comboRuleForm = this.createEmptyComboRuleForm();
    this.comboErrorMessage = '';
    this.comboSuccessMessage = '';
    this.comboRuleErrorMessage = '';
    this.comboRuleSuccessMessage = '';

    if (!combo) {
      this.comboRules = [];
      return;
    }

    this.loadComboRules(combo.id, false);
  }

  /**
   * Carrega regras do combo e opcionalmente preserva regra selecionada.
   */
  private loadComboRules(comboId: number, preserveRuleSelection: boolean) {
    this.isLoadingComboRules = true;
    this.comboRuleErrorMessage = '';

    this.adminPromotionsService.listComboRules(comboId).subscribe({
      next: (rules) => {
        this.isLoadingComboRules = false;
        this.comboRules = rules;
        this.syncComboRuleSelection(preserveRuleSelection);
        this.patchSelectedComboRulesSnapshot(comboId, rules);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingComboRules = false;
        this.comboRules = [];
        this.selectedComboRule = null;
        this.comboRuleForm = this.createEmptyComboRuleForm();
        this.comboRuleErrorMessage = this.resolveErrorMessage(
          error,
          'Nao foi possivel carregar regras do combo selecionado.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Sincroniza regra selecionada apos recarregar lista de regras.
   */
  private syncComboRuleSelection(preserveSelection: boolean) {
    if (preserveSelection && this.selectedComboRule) {
      const selectedFromList =
        this.comboRules.find((rule) => rule.id === this.selectedComboRule?.id) ?? null;
      this.applyComboRuleSelection(selectedFromList);
      return;
    }

    this.applyComboRuleSelection(null);
  }

  /**
   * Aplica selecao de regra e prepara formulario correspondente.
   */
  private applyComboRuleSelection(rule: AdminComboRule | null) {
    this.selectedComboRule = rule;
    this.comboRuleForm = rule ? this.mapComboRuleToForm(rule) : this.createEmptyComboRuleForm();
    this.comboRuleErrorMessage = '';
    this.comboRuleSuccessMessage = '';
  }

  /**
   * Atualiza snapshot de regras dentro da lista de combos em memoria.
   *
   * Motivo:
   * manter o mesmo estado entre a lista de combos e a lista de regras evita
   * divergencia visual quando o operador troca rapidamente de selecao.
   */
  private patchSelectedComboRulesSnapshot(comboId: number, rules: AdminComboRule[]) {
    this.combos = this.combos.map((combo) =>
      combo.id === comboId ? { ...combo, rules } : combo,
    );
    if (this.selectedCombo?.id === comboId) {
      this.selectedCombo = { ...this.selectedCombo, rules };
    }
  }

  /**
   * Cria payload de criacao de cupom a partir do formulario.
   */
  private buildCreateCouponPayload(): CreateAdminCouponPayload {
    return {
      code: this.couponForm.code.trim(),
      name: this.couponForm.name.trim(),
      description: this.couponForm.description.trim() || undefined,
      discountType: this.couponForm.discountType,
      discountValue: this.normalizePositiveNumber(this.couponForm.discountValue, 0.01),
      minimumOrderAmount: this.normalizeNonNegativeNumber(this.couponForm.minimumOrderAmount),
      usageLimit: this.normalizeOptionalInteger(this.couponForm.usageLimit),
      startsAt: this.toOptionalIsoDate(this.couponForm.startsAt),
      endsAt: this.toOptionalIsoDate(this.couponForm.endsAt),
      isActive: this.couponForm.isActive,
      firstOrderOnly: this.couponForm.firstOrderOnly,
    };
  }

  /**
   * Cria payload de atualizacao de cupom respeitando limpeza de datas.
   */
  private buildUpdateCouponPayload(currentCoupon: AdminCoupon): UpdateAdminCouponPayload {
    return {
      code: this.couponForm.code.trim(),
      name: this.couponForm.name.trim(),
      description: this.couponForm.description.trim() || undefined,
      discountType: this.couponForm.discountType,
      discountValue: this.normalizePositiveNumber(this.couponForm.discountValue, 0.01),
      minimumOrderAmount: this.normalizeNonNegativeNumber(this.couponForm.minimumOrderAmount),
      usageLimit: this.normalizeOptionalInteger(this.couponForm.usageLimit),
      startsAt: this.toOptionalIsoDateForUpdate(this.couponForm.startsAt, currentCoupon.startsAt),
      endsAt: this.toOptionalIsoDateForUpdate(this.couponForm.endsAt, currentCoupon.endsAt),
      isActive: this.couponForm.isActive,
      firstOrderOnly: this.couponForm.firstOrderOnly,
    };
  }

  /**
   * Cria payload de criacao de combo a partir do formulario.
   */
  private buildCreateComboPayload(): CreateAdminComboPayload {
    return {
      name: this.comboForm.name.trim(),
      description: this.comboForm.description.trim() || undefined,
      discountType: this.comboForm.discountType,
      discountValue: this.normalizePositiveNumber(this.comboForm.discountValue, 0.01),
      startsAt: this.toOptionalIsoDate(this.comboForm.startsAt),
      endsAt: this.toOptionalIsoDate(this.comboForm.endsAt),
      isActive: this.comboForm.isActive,
    };
  }

  /**
   * Cria payload de atualizacao de combo respeitando limpeza de datas.
   */
  private buildUpdateComboPayload(currentCombo: AdminCombo): UpdateAdminComboPayload {
    return {
      name: this.comboForm.name.trim(),
      description: this.comboForm.description.trim() || undefined,
      discountType: this.comboForm.discountType,
      discountValue: this.normalizePositiveNumber(this.comboForm.discountValue, 0.01),
      startsAt: this.toOptionalIsoDateForUpdate(this.comboForm.startsAt, currentCombo.startsAt),
      endsAt: this.toOptionalIsoDateForUpdate(this.comboForm.endsAt, currentCombo.endsAt),
      isActive: this.comboForm.isActive,
    };
  }

  /**
   * Cria payload de criacao de regra, validando alvo minimo obrigatorio.
   */
  private buildCreateComboRulePayload(): CreateAdminComboRulePayload | null {
    const minimumQuantity = this.normalizeInteger(this.comboRuleForm.minimumQuantity, 1);
    const targetId = this.resolveComboRuleTargetId();
    if (targetId === null) {
      return null;
    }

    if (this.comboRuleForm.type === 'product') {
      return {
        type: 'product',
        productId: targetId,
        minimumQuantity,
      };
    }

    return {
      type: 'category',
      categoryId: targetId,
      minimumQuantity,
    };
  }

  /**
   * Cria payload de atualizacao de regra limpando alvo oposto.
   *
   * Motivo:
   * quando o tipo troca (produto <-> categoria), enviamos `null` para o alvo
   * antigo para evitar regra invalida com os dois campos preenchidos.
   */
  private buildUpdateComboRulePayload(): UpdateAdminComboRulePayload | null {
    const minimumQuantity = this.normalizeInteger(this.comboRuleForm.minimumQuantity, 1);
    const targetId = this.resolveComboRuleTargetId();
    if (targetId === null) {
      return null;
    }

    if (this.comboRuleForm.type === 'product') {
      return {
        type: 'product',
        productId: targetId,
        categoryId: null,
        minimumQuantity,
      };
    }

    return {
      type: 'category',
      categoryId: targetId,
      productId: null,
      minimumQuantity,
    };
  }

  /**
   * Resolve identificador alvo da regra e publica erro amigavel.
   */
  private resolveComboRuleTargetId() {
    const rawTargetId =
      this.comboRuleForm.type === 'product'
        ? this.comboRuleForm.productId
        : this.comboRuleForm.categoryId;

    if (rawTargetId === null || rawTargetId === undefined || rawTargetId < 1) {
      this.comboRuleErrorMessage =
        this.comboRuleForm.type === 'product'
          ? 'Informe um productId valido para a regra.'
          : 'Informe um categoryId valido para a regra.';
      return null;
    }

    return Math.floor(rawTargetId);
  }

  /**
   * Mapeia cupom recebido da API para formulario editavel.
   */
  private mapCouponToForm(coupon: AdminCoupon): CouponFormModel {
    return {
      code: coupon.code,
      name: coupon.name,
      description: coupon.description ?? '',
      discountType: coupon.discountType,
      discountValue: this.toNumber(coupon.discountValue),
      minimumOrderAmount: this.toNumber(coupon.minimumOrderAmount),
      usageLimit: coupon.usageLimit,
      startsAt: this.toDateTimeLocalValue(coupon.startsAt),
      endsAt: this.toDateTimeLocalValue(coupon.endsAt),
      isActive: coupon.isActive,
      firstOrderOnly: coupon.firstOrderOnly,
    };
  }

  /**
   * Mapeia combo recebido da API para formulario editavel.
   */
  private mapComboToForm(combo: AdminCombo): ComboFormModel {
    return {
      name: combo.name,
      description: combo.description ?? '',
      discountType: combo.discountType,
      discountValue: this.toNumber(combo.discountValue),
      startsAt: this.toDateTimeLocalValue(combo.startsAt),
      endsAt: this.toDateTimeLocalValue(combo.endsAt),
      isActive: combo.isActive,
    };
  }

  /**
   * Mapeia regra de combo para formulario editavel.
   */
  private mapComboRuleToForm(rule: AdminComboRule): ComboRuleFormModel {
    return {
      type: rule.type,
      productId: rule.productId,
      categoryId: rule.categoryId,
      minimumQuantity: rule.minimumQuantity,
    };
  }

  /**
   * Cria estado inicial do formulario de cupom.
   */
  private createEmptyCouponForm(): CouponFormModel {
    return {
      code: '',
      name: '',
      description: '',
      discountType: 'fixed',
      discountValue: 1,
      minimumOrderAmount: 0,
      usageLimit: null,
      startsAt: '',
      endsAt: '',
      isActive: true,
      firstOrderOnly: false,
    };
  }

  /**
   * Cria estado inicial do formulario de combo.
   */
  private createEmptyComboForm(): ComboFormModel {
    return {
      name: '',
      description: '',
      discountType: 'fixed',
      discountValue: 1,
      startsAt: '',
      endsAt: '',
      isActive: true,
    };
  }

  /**
   * Cria estado inicial do formulario de regra de combo.
   */
  private createEmptyComboRuleForm(): ComboRuleFormModel {
    return {
      type: 'product',
      productId: null,
      categoryId: null,
      minimumQuantity: 1,
    };
  }

  /**
   * Normaliza valor positivo para campos monetarios obrigatorios.
   */
  private normalizePositiveNumber(value: number | null | undefined, fallback: number) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }

    return fallback;
  }

  /**
   * Normaliza valor nao negativo para campos monetarios opcionais.
   */
  private normalizeNonNegativeNumber(value: number | null | undefined) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value;
    }

    return 0;
  }

  /**
   * Normaliza inteiro opcional maior que zero.
   */
  private normalizeOptionalInteger(value: number | null | undefined) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
      return Math.floor(value);
    }

    return undefined;
  }

  /**
   * Normaliza inteiro obrigatorio respeitando valor minimo aceito.
   */
  private normalizeInteger(value: number | null | undefined, minimum: number) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= minimum) {
      return Math.floor(value);
    }

    return minimum;
  }

  /**
   * Converte string de data opcional para ISO, mantendo vazio como undefined.
   */
  private toOptionalIsoDate(rawDate: string) {
    if (!rawDate.trim()) {
      return undefined;
    }

    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString();
  }

  /**
   * Converte string de data para ISO considerando limpeza em modo edicao.
   */
  private toOptionalIsoDateForUpdate(rawDate: string, currentValue: string | null) {
    if (!rawDate.trim()) {
      return currentValue ? null : undefined;
    }

    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString();
  }

  /**
   * Converte data ISO para formato `datetime-local`.
   *
   * Motivo:
   * removemos o offset antes de formatar para evitar que o navegador mostre
   * horario deslocado em relacao ao que veio do backend.
   */
  private toDateTimeLocalValue(isoDate: string | null) {
    if (!isoDate) {
      return '';
    }

    const parsedDate = new Date(isoDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    const timezoneOffsetInMs = parsedDate.getTimezoneOffset() * 60000;
    return new Date(parsedDate.getTime() - timezoneOffsetInMs).toISOString().slice(0, 16);
  }

  /**
   * Resolve mensagem padrao de erro a partir da resposta da API.
   */
  private resolveErrorMessage(error: unknown, fallbackMessage: string) {
    const httpLikeError = error as { error?: { message?: unknown } } | undefined;
    const apiMessage = httpLikeError?.error?.message;
    return typeof apiMessage === 'string' ? apiMessage : fallbackMessage;
  }
}
