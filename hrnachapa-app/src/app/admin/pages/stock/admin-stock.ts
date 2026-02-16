import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminStockAlertLevel,
  AdminStockIngredient,
  AdminStockLowStockAlert,
  AdminStockMovement,
  AdminStockMovementSource,
  AdminStockMovementType,
  AdminStockService,
  CreateAdminStockMovementPayload,
  CreateAdminStockIngredientPayload,
  UpdateAdminStockIngredientPayload,
} from '../../services/admin-stock.service';

interface IngredientFormModel {
  name: string;
  unit: string;
  stockQuantity: number;
  minimumQuantity: number;
  isActive: boolean;
}

type IngredientStatusFilter = 'all' | 'active' | 'inactive';

interface MovementFormModel {
  ingredientId: number | null;
  type: AdminStockMovementType;
  quantity: number;
  targetQuantity: number;
  reason: string;
  notes: string;
}

type MovementTypeFilter = 'all' | AdminStockMovementType;
type MovementSourceFilter = 'all' | AdminStockMovementSource;

@Component({
  selector: 'app-admin-stock',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-stock.html',
  styleUrl: './admin-stock.css',
})
/**
 * Modulo administrativo de insumos.
 *
 * Responsabilidades:
 * - listar, criar, editar e remover insumos;
 * - expor alertas de estoque minimo para operacao;
 * - preparar base de insumos consumidos por receitas e extras do cardapio.
 */
export class AdminStockComponent implements OnInit {
  readonly movementTypeOptions: AdminStockMovementType[] = ['entry', 'exit', 'adjustment'];
  readonly movementSourceOptions: AdminStockMovementSource[] = ['manual', 'order_confirmation'];

  ingredients: AdminStockIngredient[] = [];
  lowStockAlerts: AdminStockLowStockAlert[] = [];
  stockMovements: AdminStockMovement[] = [];
  selectedIngredient: AdminStockIngredient | null = null;
  ingredientForm: IngredientFormModel = this.createEmptyIngredientForm();
  movementForm: MovementFormModel = this.createEmptyMovementForm();

  searchTerm = '';
  statusFilter: IngredientStatusFilter = 'all';
  includeInactiveInAlerts = false;
  alertsLimit = 50;
  movementIngredientFilterId: number | null = null;
  movementTypeFilter: MovementTypeFilter = 'all';
  movementSourceFilter: MovementSourceFilter = 'all';
  movementOrderFilterId: number | null = null;
  movementsLimit = 100;

  isLoadingIngredients = false;
  isLoadingAlerts = false;
  isLoadingMovements = false;
  isSavingIngredient = false;
  isSavingMovement = false;

  ingredientErrorMessage = '';
  ingredientSuccessMessage = '';
  alertsErrorMessage = '';
  movementErrorMessage = '';
  movementSuccessMessage = '';

  /**
   * Injeta adaptador HTTP e detector de mudanca para sincronizar a UI.
   */
  constructor(
    private readonly adminStockService: AdminStockService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  /**
   * Carrega dados iniciais na abertura da pagina.
   */
  ngOnInit() {
    this.loadIngredients(false);
    this.loadLowStockAlerts();
    this.loadStockMovements();
  }

  /**
   * Filtra insumos por busca textual e status ativo/inativo.
   */
  get filteredIngredients() {
    const normalizedSearchTerm = this.searchTerm.trim().toLowerCase();

    return this.ingredients.filter((ingredient) => {
      if (this.statusFilter === 'active' && !ingredient.isActive) {
        return false;
      }
      if (this.statusFilter === 'inactive' && ingredient.isActive) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      return (
        ingredient.name.toLowerCase().includes(normalizedSearchTerm) ||
        ingredient.unit.toLowerCase().includes(normalizedSearchTerm)
      );
    });
  }

  /**
   * Recarrega insumos preservando selecao quando solicitado.
   */
  loadIngredients(preserveSelection: boolean) {
    this.isLoadingIngredients = true;
    this.ingredientErrorMessage = '';

    this.adminStockService.listIngredients().subscribe({
      next: (ingredients) => {
        this.isLoadingIngredients = false;
        this.ingredients = ingredients;
        this.syncSelectedIngredient(preserveSelection);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingIngredients = false;
        this.ingredientErrorMessage = this.resolveErrorMessage(
          error,
          'Nao foi possivel carregar os insumos.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Recarrega alertas de estoque minimo com filtros atuais.
   */
  loadLowStockAlerts() {
    this.isLoadingAlerts = true;
    this.alertsErrorMessage = '';

    this.adminStockService
      .listLowStockAlerts({
        includeInactive: this.includeInactiveInAlerts,
        limit: this.normalizeInteger(this.alertsLimit, 1),
      })
      .subscribe({
        next: (alerts) => {
          this.isLoadingAlerts = false;
          this.lowStockAlerts = alerts;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoadingAlerts = false;
          this.alertsErrorMessage = this.resolveErrorMessage(
            error,
            'Nao foi possivel carregar alertas de estoque minimo.',
          );
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Recarrega historico de movimentacoes com filtros atuais.
   */
  loadStockMovements() {
    this.isLoadingMovements = true;
    this.movementErrorMessage = '';

    this.adminStockService
      .listStockMovements({
        ingredientId:
          this.movementIngredientFilterId !== null ? this.movementIngredientFilterId : undefined,
        type: this.movementTypeFilter !== 'all' ? this.movementTypeFilter : undefined,
        source: this.movementSourceFilter !== 'all' ? this.movementSourceFilter : undefined,
        orderId: this.movementOrderFilterId !== null ? this.movementOrderFilterId : undefined,
        limit: this.normalizeInteger(this.movementsLimit, 1),
      })
      .subscribe({
        next: (movements) => {
          this.isLoadingMovements = false;
          this.stockMovements = movements;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoadingMovements = false;
          this.movementErrorMessage = this.resolveErrorMessage(
            error,
            'Nao foi possivel carregar movimentacoes de estoque.',
          );
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Recarrega insumos e alertas juntos.
   */
  refreshAll() {
    this.loadIngredients(true);
    this.loadLowStockAlerts();
    this.loadStockMovements();
  }

  /**
   * Seleciona insumo e popula formulario para edicao.
   */
  selectIngredient(ingredientId: number) {
    const ingredient = this.ingredients.find((item) => item.id === ingredientId) ?? null;
    this.applyIngredientSelection(ingredient);
    if (ingredient) {
      this.movementForm.ingredientId = ingredient.id;
    }
  }

  /**
   * Limpa selecao para iniciar criacao de novo insumo.
   */
  startNewIngredient() {
    this.applyIngredientSelection(null);
  }

  /**
   * Reseta formulario de movimentacao mantendo contexto do insumo selecionado.
   */
  startNewMovement(clearFeedback = true) {
    const selectedIngredientId = this.selectedIngredient?.id ?? null;
    this.movementForm = this.createEmptyMovementForm();
    this.movementForm.ingredientId = selectedIngredientId;
    this.movementErrorMessage = '';
    if (clearFeedback) {
      this.movementSuccessMessage = '';
    }
  }

  /**
   * Persiste formulario como criacao ou atualizacao de insumo.
   */
  saveIngredient() {
    const normalizedName = this.ingredientForm.name.trim();
    const normalizedUnit = this.ingredientForm.unit.trim().toLowerCase();

    if (!normalizedName) {
      this.ingredientErrorMessage = 'Nome do insumo e obrigatorio.';
      return;
    }

    if (!normalizedUnit) {
      this.ingredientErrorMessage = 'Unidade do insumo e obrigatoria.';
      return;
    }

    this.isSavingIngredient = true;
    this.ingredientErrorMessage = '';
    this.ingredientSuccessMessage = '';

    if (this.selectedIngredient) {
      const payload: UpdateAdminStockIngredientPayload = {
        name: normalizedName,
        unit: normalizedUnit,
        stockQuantity: this.normalizeNonNegativeNumber(this.ingredientForm.stockQuantity),
        minimumQuantity: this.normalizeNonNegativeNumber(this.ingredientForm.minimumQuantity),
        isActive: this.ingredientForm.isActive,
      };
      this.adminStockService.updateIngredient(this.selectedIngredient.id, payload).subscribe({
        next: () => {
          this.isSavingIngredient = false;
          this.ingredientSuccessMessage = 'Insumo atualizado com sucesso.';
          this.loadIngredients(true);
          this.loadLowStockAlerts();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isSavingIngredient = false;
          this.ingredientErrorMessage = this.resolveErrorMessage(
            error,
            'Falha ao atualizar insumo.',
          );
          this.cdr.detectChanges();
        },
      });
      return;
    }

    const payload: CreateAdminStockIngredientPayload = {
      name: normalizedName,
      unit: normalizedUnit,
      stockQuantity: this.normalizeNonNegativeNumber(this.ingredientForm.stockQuantity),
      minimumQuantity: this.normalizeNonNegativeNumber(this.ingredientForm.minimumQuantity),
      isActive: this.ingredientForm.isActive,
    };
    this.adminStockService.createIngredient(payload).subscribe({
      next: (ingredient) => {
        this.isSavingIngredient = false;
        this.selectedIngredient = ingredient;
        this.ingredientSuccessMessage = 'Insumo criado com sucesso.';
        this.loadIngredients(true);
        this.loadLowStockAlerts();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingIngredient = false;
        this.ingredientErrorMessage = this.resolveErrorMessage(error, 'Falha ao criar insumo.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Remove insumo selecionado apos confirmacao explicita do operador.
   */
  deleteSelectedIngredient() {
    if (!this.selectedIngredient) {
      return;
    }

    const ingredient = this.selectedIngredient;
    const confirmed = window.confirm(`Deseja remover o insumo "${ingredient.name}"?`);
    if (!confirmed) {
      return;
    }

    this.isSavingIngredient = true;
    this.ingredientErrorMessage = '';
    this.ingredientSuccessMessage = '';

    this.adminStockService.deleteIngredient(ingredient.id).subscribe({
      next: () => {
        this.isSavingIngredient = false;
        this.ingredientSuccessMessage = 'Insumo removido com sucesso.';
        this.applyIngredientSelection(null);
        this.loadIngredients(false);
        this.loadLowStockAlerts();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingIngredient = false;
        this.ingredientErrorMessage = this.resolveErrorMessage(
          error,
          'Falha ao remover insumo.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Cria movimentacao manual de estoque (entrada, saida ou ajuste).
   */
  saveMovement() {
    if (this.movementForm.ingredientId === null) {
      this.movementErrorMessage = 'Selecione um insumo para registrar movimentacao.';
      return;
    }

    const normalizedReason = this.movementForm.reason.trim();
    if (!normalizedReason) {
      this.movementErrorMessage = 'Motivo da movimentacao e obrigatorio.';
      return;
    }

    const payload: CreateAdminStockMovementPayload = {
      ingredientId: this.movementForm.ingredientId,
      type: this.movementForm.type,
      reason: normalizedReason,
      notes: this.movementForm.notes.trim() || undefined,
    };

    if (this.movementForm.type === 'adjustment') {
      payload.targetQuantity = this.normalizeNonNegativeNumber(this.movementForm.targetQuantity);
    } else {
      payload.quantity = this.normalizePositiveNumber(this.movementForm.quantity, 0.001);
    }

    this.isSavingMovement = true;
    this.movementErrorMessage = '';
    this.movementSuccessMessage = '';

    this.adminStockService.createStockMovement(payload).subscribe({
      next: () => {
        this.isSavingMovement = false;
        this.loadIngredients(true);
        this.loadLowStockAlerts();
        this.loadStockMovements();
        this.startNewMovement(false);
        this.movementSuccessMessage = 'Movimentacao registrada com sucesso.';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingMovement = false;
        this.movementErrorMessage = this.resolveErrorMessage(
          error,
          'Falha ao registrar movimentacao de estoque.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Traduz nivel do alerta para rotulo de negocio.
   */
  getAlertLevelLabel(alertLevel: AdminStockAlertLevel) {
    return alertLevel === 'out_of_stock' ? 'Sem estoque' : 'Abaixo do minimo';
  }

  /**
   * Resolve classe visual conforme severidade do alerta.
   */
  getAlertLevelBadgeClass(alertLevel: AdminStockAlertLevel) {
    return alertLevel === 'out_of_stock'
      ? 'bg-red-100 text-red-700 border border-red-200'
      : 'bg-amber-100 text-amber-700 border border-amber-200';
  }

  /**
   * Resolve classes visuais para status ativo/inativo.
   */
  getActivationBadgeClass(isActive: boolean) {
    return isActive
      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      : 'bg-stone-200 text-stone-700 border border-stone-300';
  }

  /**
   * Traduz tipo de movimentacao para rotulo legivel.
   */
  getMovementTypeLabel(type: AdminStockMovementType) {
    const labels: Record<AdminStockMovementType, string> = {
      entry: 'Entrada',
      exit: 'Saida',
      adjustment: 'Ajuste',
    };

    return labels[type];
  }

  /**
   * Traduz origem da movimentacao para rotulo legivel.
   */
  getMovementSourceLabel(source: AdminStockMovementSource) {
    const labels: Record<AdminStockMovementSource, string> = {
      manual: 'Manual',
      order_confirmation: 'Confirmacao de pedido',
    };

    return labels[source];
  }

  /**
   * Resolve classes visuais conforme tipo de movimentacao.
   */
  getMovementTypeBadgeClass(type: AdminStockMovementType) {
    const classesByType: Record<AdminStockMovementType, string> = {
      entry: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      exit: 'bg-red-100 text-red-700 border border-red-200',
      adjustment: 'bg-blue-100 text-blue-700 border border-blue-200',
    };

    return classesByType[type];
  }

  /**
   * Resolve classes visuais para origem da movimentacao.
   */
  getMovementSourceBadgeClass(source: AdminStockMovementSource) {
    const classesBySource: Record<AdminStockMovementSource, string> = {
      manual: 'bg-stone-100 text-stone-700 border border-stone-200',
      order_confirmation: 'bg-purple-100 text-purple-700 border border-purple-200',
    };

    return classesBySource[source];
  }

  /**
   * Formata variacao de quantidade com sinal explicito.
   */
  getSignedQuantityLabel(quantityChange: string | number) {
    const normalizedValue = this.toNumber(quantityChange);
    return normalizedValue > 0 ? `+${normalizedValue.toFixed(3)}` : normalizedValue.toFixed(3);
  }

  /**
   * Converte valores numericos da API para numero seguro no template.
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
   * Sincroniza item selecionado apos recarga da lista.
   */
  private syncSelectedIngredient(preserveSelection: boolean) {
    if (!preserveSelection || !this.selectedIngredient) {
      return;
    }

    const selectedFromList =
      this.ingredients.find((ingredient) => ingredient.id === this.selectedIngredient?.id) ?? null;
    this.applyIngredientSelection(selectedFromList);
  }

  /**
   * Aplica selecao de insumo e prepara formulario correspondente.
   */
  private applyIngredientSelection(ingredient: AdminStockIngredient | null) {
    this.selectedIngredient = ingredient;
    this.ingredientForm = ingredient
      ? this.mapIngredientToForm(ingredient)
      : this.createEmptyIngredientForm();
    if (ingredient && this.movementForm.ingredientId === null) {
      // Aproveitamos o mesmo contexto de selecao para reduzir digitacao
      // quando o operador registra movimentacao do insumo aberto.
      this.movementForm.ingredientId = ingredient.id;
    }
    this.ingredientErrorMessage = '';
    this.ingredientSuccessMessage = '';
  }

  /**
   * Mapeia entidade de insumo para modelo de formulario editavel.
   */
  private mapIngredientToForm(ingredient: AdminStockIngredient): IngredientFormModel {
    return {
      name: ingredient.name,
      unit: ingredient.unit,
      stockQuantity: this.toNumber(ingredient.stockQuantity),
      minimumQuantity: this.toNumber(ingredient.minimumQuantity),
      isActive: ingredient.isActive,
    };
  }

  /**
   * Cria estado inicial do formulario de insumo.
   */
  private createEmptyIngredientForm(): IngredientFormModel {
    return {
      name: '',
      unit: 'g',
      stockQuantity: 0,
      minimumQuantity: 0,
      isActive: true,
    };
  }

  /**
   * Cria estado inicial do formulario de movimentacao manual.
   */
  private createEmptyMovementForm(): MovementFormModel {
    return {
      ingredientId: null,
      type: 'entry',
      quantity: 0.001,
      targetQuantity: 0,
      reason: '',
      notes: '',
    };
  }

  /**
   * Normaliza valores inteiros com minimo configuravel.
   */
  private normalizeInteger(value: number | null | undefined, minimum: number) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(minimum, Math.floor(value));
    }

    return minimum;
  }

  /**
   * Normaliza valores decimais nao negativos.
   */
  private normalizeNonNegativeNumber(value: number | null | undefined) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value;
    }

    return 0;
  }

  /**
   * Normaliza valores decimais positivos com fallback minimo.
   */
  private normalizePositiveNumber(value: number | null | undefined, fallback: number) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }

    return fallback;
  }

  /**
   * Resolve mensagem amigavel de erro a partir da resposta HTTP.
   */
  private resolveErrorMessage(error: unknown, fallbackMessage: string) {
    const httpLikeError = error as { error?: { message?: unknown } } | undefined;
    const apiMessage = httpLikeError?.error?.message;
    return typeof apiMessage === 'string' ? apiMessage : fallbackMessage;
  }
}
