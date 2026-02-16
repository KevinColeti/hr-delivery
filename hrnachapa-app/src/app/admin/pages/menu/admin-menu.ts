import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  AdminMenuCategory,
  AdminMenuIngredient,
  AdminMenuProduct,
  AdminMenuProductExtra,
  AdminMenuRecipeItem,
  AdminMenuService,
  CreateAdminMenuCategoryPayload,
  CreateAdminMenuProductExtraPayload,
  CreateAdminMenuProductPayload,
  CreateAdminMenuRecipeItemPayload,
  UpdateAdminMenuCategoryPayload,
  UpdateAdminMenuProductExtraPayload,
  UpdateAdminMenuProductPayload,
  UpdateAdminMenuRecipeItemPayload,
} from '../../services/admin-menu.service';

interface CategoryFormModel {
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

interface ProductFormModel {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: number | null;
  isActive: boolean;
}

interface RecipeFormModel {
  ingredientId: number | null;
  quantity: number;
  unit: string;
}

interface ProductExtraFormModel {
  name: string;
  price: number;
  sortOrder: number;
  isActive: boolean;
  ingredientId: number | null;
  ingredientQuantity: number | null;
  ingredientUnit: string;
}

type ProductCategoryFilter = 'all' | number;

@Component({
  selector: 'app-admin-menu',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-menu.html',
  styleUrl: './admin-menu.css',
})
/**
 * Modulo administrativo de cardapio.
 *
 * Responsabilidades:
 * - CRUD de categorias;
 * - CRUD de produtos;
 * - CRUD de receita por produto;
 * - CRUD de extras por produto.
 */
export class AdminMenuComponent implements OnInit {
  categories: AdminMenuCategory[] = [];
  products: AdminMenuProduct[] = [];
  ingredients: AdminMenuIngredient[] = [];
  recipeItems: AdminMenuRecipeItem[] = [];
  productExtras: AdminMenuProductExtra[] = [];

  selectedCategory: AdminMenuCategory | null = null;
  selectedProduct: AdminMenuProduct | null = null;
  selectedRecipeItem: AdminMenuRecipeItem | null = null;
  selectedProductExtra: AdminMenuProductExtra | null = null;

  categoryForm: CategoryFormModel = this.createEmptyCategoryForm();
  productForm: ProductFormModel = this.createEmptyProductForm();
  recipeForm: RecipeFormModel = this.createEmptyRecipeForm();
  productExtraForm: ProductExtraFormModel = this.createEmptyProductExtraForm();

  productCategoryFilter: ProductCategoryFilter = 'all';

  isLoadingCategories = false;
  isLoadingProducts = false;
  isLoadingIngredients = false;
  isLoadingProductComposition = false;

  isSavingCategory = false;
  isSavingProduct = false;
  isSavingRecipeItem = false;
  isSavingProductExtra = false;

  categoryErrorMessage = '';
  categorySuccessMessage = '';
  productErrorMessage = '';
  productSuccessMessage = '';
  recipeErrorMessage = '';
  recipeSuccessMessage = '';
  productExtraErrorMessage = '';
  productExtraSuccessMessage = '';

  /**
   * Injeta adaptador de cardapio e detector para sincronizar renderizacao.
   */
  constructor(
    private readonly adminMenuService: AdminMenuService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  /**
   * Carrega dados base na inicializacao do modulo.
   */
  ngOnInit() {
    this.loadCategories(false);
    this.loadProducts(false);
    this.loadIngredients();
  }

  /**
   * Retorna produtos visiveis segundo filtro atual de categoria.
   */
  get filteredProducts() {
    if (this.productCategoryFilter === 'all') {
      return this.products;
    }

    return this.products.filter((product) => product.categoryId === this.productCategoryFilter);
  }

  /**
   * Recarrega categorias do backend.
   */
  loadCategories(preserveSelection: boolean) {
    this.isLoadingCategories = true;
    this.categoryErrorMessage = '';

    this.adminMenuService.listCategories().subscribe({
      next: (categories) => {
        this.isLoadingCategories = false;
        this.categories = categories;
        this.syncCategorySelection(preserveSelection);

        if (
          this.productForm.categoryId !== null &&
          !this.categories.some((category) => category.id === this.productForm.categoryId)
        ) {
          this.productForm.categoryId = null;
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingCategories = false;
        this.categoryErrorMessage = this.resolveErrorMessage(
          error,
          'Nao foi possivel carregar as categorias.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Recarrega produtos do backend.
   */
  loadProducts(preserveSelection: boolean) {
    this.isLoadingProducts = true;
    this.productErrorMessage = '';

    this.adminMenuService.listProducts().subscribe({
      next: (products) => {
        this.isLoadingProducts = false;
        this.products = products;
        this.syncProductSelection(preserveSelection);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingProducts = false;
        this.productErrorMessage = this.resolveErrorMessage(
          error,
          'Nao foi possivel carregar os produtos.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Carrega insumos para os seletores de receita e extras.
   */
  loadIngredients() {
    this.isLoadingIngredients = true;

    this.adminMenuService.listIngredients().subscribe({
      next: (ingredients) => {
        this.isLoadingIngredients = false;
        this.ingredients = ingredients;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingIngredients = false;
        this.ingredients = [];
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Seleciona categoria e popula formulario para edicao.
   */
  selectCategory(categoryId: number) {
    const category = this.categories.find((item) => item.id === categoryId) ?? null;
    this.applyCategorySelection(category);
  }

  /**
   * Prepara formulario para criacao de categoria.
   */
  startNewCategory() {
    this.applyCategorySelection(null);
  }

  /**
   * Sugere slug com base no nome da categoria em edicao.
   */
  generateSlugFromCategoryName() {
    this.categoryForm.slug = this.slugify(this.categoryForm.name);
  }

  /**
   * Persiste categoria como criacao ou atualizacao.
   */
  saveCategory() {
    const normalizedName = this.categoryForm.name.trim();
    const normalizedSlug = this.categoryForm.slug.trim().toLowerCase();
    if (!normalizedName) {
      this.categoryErrorMessage = 'Nome da categoria e obrigatorio.';
      return;
    }
    if (!normalizedSlug) {
      this.categoryErrorMessage = 'Slug da categoria e obrigatorio.';
      return;
    }

    this.isSavingCategory = true;
    this.categoryErrorMessage = '';
    this.categorySuccessMessage = '';

    if (this.selectedCategory) {
      const payload: UpdateAdminMenuCategoryPayload = {
        name: normalizedName,
        slug: normalizedSlug,
        sortOrder: this.normalizeInteger(this.categoryForm.sortOrder, 0),
        isActive: this.categoryForm.isActive,
      };
      this.adminMenuService.updateCategory(this.selectedCategory.id, payload).subscribe({
        next: () => {
          this.isSavingCategory = false;
          this.categorySuccessMessage = 'Categoria atualizada com sucesso.';
          this.loadCategories(true);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isSavingCategory = false;
          this.categoryErrorMessage = this.resolveErrorMessage(
            error,
            'Falha ao atualizar categoria.',
          );
          this.cdr.detectChanges();
        },
      });
      return;
    }

    const payload: CreateAdminMenuCategoryPayload = {
      name: normalizedName,
      slug: normalizedSlug,
      sortOrder: this.normalizeInteger(this.categoryForm.sortOrder, 0),
      isActive: this.categoryForm.isActive,
    };
    this.adminMenuService.createCategory(payload).subscribe({
      next: (category) => {
        this.isSavingCategory = false;
        this.categorySuccessMessage = 'Categoria criada com sucesso.';
        this.selectedCategory = category;
        this.loadCategories(true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingCategory = false;
        this.categoryErrorMessage = this.resolveErrorMessage(error, 'Falha ao criar categoria.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Remove categoria selecionada apos confirmacao do operador.
   */
  deleteSelectedCategory() {
    if (!this.selectedCategory) {
      return;
    }

    const category = this.selectedCategory;
    const confirmed = window.confirm(`Deseja remover a categoria "${category.name}"?`);
    if (!confirmed) {
      return;
    }

    this.isSavingCategory = true;
    this.categoryErrorMessage = '';
    this.categorySuccessMessage = '';

    this.adminMenuService.deleteCategory(category.id).subscribe({
      next: () => {
        this.isSavingCategory = false;
        this.categorySuccessMessage = 'Categoria removida com sucesso.';
        this.applyCategorySelection(null);
        this.loadCategories(false);
        this.loadProducts(true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingCategory = false;
        this.categoryErrorMessage = this.resolveErrorMessage(error, 'Falha ao remover categoria.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Seleciona produto e carrega sua composicao (receita e extras).
   */
  selectProduct(productId: number) {
    const product = this.products.find((item) => item.id === productId) ?? null;
    this.applyProductSelection(product, false);
  }

  /**
   * Prepara formulario para criacao de produto.
   */
  startNewProduct() {
    this.applyProductSelection(null, false);
  }

  /**
   * Persiste produto como criacao ou atualizacao.
   */
  saveProduct() {
    const normalizedName = this.productForm.name.trim();
    if (!normalizedName) {
      this.productErrorMessage = 'Nome do produto e obrigatorio.';
      return;
    }
    if (this.productForm.categoryId === null) {
      this.productErrorMessage = 'Selecione uma categoria para o produto.';
      return;
    }

    this.isSavingProduct = true;
    this.productErrorMessage = '';
    this.productSuccessMessage = '';

    if (this.selectedProduct) {
      const payload: UpdateAdminMenuProductPayload = {
        name: normalizedName,
        description: this.productForm.description.trim() || undefined,
        price: this.normalizeNonNegativeNumber(this.productForm.price),
        imageUrl: this.productForm.imageUrl.trim() || undefined,
        categoryId: this.productForm.categoryId,
        isActive: this.productForm.isActive,
      };
      this.adminMenuService.updateProduct(this.selectedProduct.id, payload).subscribe({
        next: () => {
          this.isSavingProduct = false;
          this.productSuccessMessage = 'Produto atualizado com sucesso.';
          this.loadProducts(true);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isSavingProduct = false;
          this.productErrorMessage = this.resolveErrorMessage(error, 'Falha ao atualizar produto.');
          this.cdr.detectChanges();
        },
      });
      return;
    }

    const payload: CreateAdminMenuProductPayload = {
      name: normalizedName,
      description: this.productForm.description.trim() || undefined,
      price: this.normalizeNonNegativeNumber(this.productForm.price),
      imageUrl: this.productForm.imageUrl.trim() || undefined,
      categoryId: this.productForm.categoryId,
      isActive: this.productForm.isActive,
    };
    this.adminMenuService.createProduct(payload).subscribe({
      next: (product) => {
        this.isSavingProduct = false;
        this.productSuccessMessage = 'Produto criado com sucesso.';
        this.selectedProduct = product;
        this.loadProducts(true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingProduct = false;
        this.productErrorMessage = this.resolveErrorMessage(error, 'Falha ao criar produto.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Remove produto selecionado apos confirmacao do operador.
   */
  deleteSelectedProduct() {
    if (!this.selectedProduct) {
      return;
    }

    const product = this.selectedProduct;
    const confirmed = window.confirm(`Deseja remover o produto "${product.name}"?`);
    if (!confirmed) {
      return;
    }

    this.isSavingProduct = true;
    this.productErrorMessage = '';
    this.productSuccessMessage = '';

    this.adminMenuService.deleteProduct(product.id).subscribe({
      next: () => {
        this.isSavingProduct = false;
        this.productSuccessMessage = 'Produto removido com sucesso.';
        this.applyProductSelection(null, false);
        this.loadProducts(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingProduct = false;
        this.productErrorMessage = this.resolveErrorMessage(error, 'Falha ao remover produto.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Recarrega composicao do produto selecionado.
   */
  refreshSelectedProductComposition() {
    if (!this.selectedProduct) {
      return;
    }

    this.loadProductComposition(this.selectedProduct.id, true, true);
  }

  /**
   * Seleciona item de receita para edicao.
   */
  selectRecipeItem(recipeItemId: number) {
    const recipeItem = this.recipeItems.find((item) => item.id === recipeItemId) ?? null;
    this.applyRecipeItemSelection(recipeItem);
  }

  /**
   * Prepara formulario para criacao de item de receita.
   */
  startNewRecipeItem() {
    this.applyRecipeItemSelection(null);
  }

  /**
   * Persiste item de receita como criacao ou atualizacao.
   */
  saveRecipeItem() {
    if (!this.selectedProduct) {
      this.recipeErrorMessage = 'Selecione um produto antes de editar a receita.';
      return;
    }

    this.isSavingRecipeItem = true;
    this.recipeErrorMessage = '';
    this.recipeSuccessMessage = '';

    const selectedProductId = this.selectedProduct.id;
    if (this.selectedRecipeItem) {
      const payload: UpdateAdminMenuRecipeItemPayload = {
        quantity: this.normalizePositiveNumber(this.recipeForm.quantity, 0.001),
        unit: this.recipeForm.unit.trim() || undefined,
      };
      this.adminMenuService
        .updateRecipeItem(selectedProductId, this.selectedRecipeItem.id, payload)
        .subscribe({
          next: () => {
            this.isSavingRecipeItem = false;
            this.recipeSuccessMessage = 'Item de receita atualizado com sucesso.';
            this.loadProductComposition(selectedProductId, true, true);
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.isSavingRecipeItem = false;
            this.recipeErrorMessage = this.resolveErrorMessage(
              error,
              'Falha ao atualizar item de receita.',
            );
            this.cdr.detectChanges();
          },
        });
      return;
    }

    if (this.recipeForm.ingredientId === null) {
      this.isSavingRecipeItem = false;
      this.recipeErrorMessage = 'Selecione um insumo para criar o item de receita.';
      this.cdr.detectChanges();
      return;
    }

    const payload: CreateAdminMenuRecipeItemPayload = {
      ingredientId: this.recipeForm.ingredientId,
      quantity: this.normalizePositiveNumber(this.recipeForm.quantity, 0.001),
      unit: this.recipeForm.unit.trim() || undefined,
    };
    this.adminMenuService.createRecipeItem(selectedProductId, payload).subscribe({
      next: () => {
        this.isSavingRecipeItem = false;
        this.recipeSuccessMessage = 'Item de receita criado com sucesso.';
        this.loadProductComposition(selectedProductId, false, true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingRecipeItem = false;
        this.recipeErrorMessage = this.resolveErrorMessage(
          error,
          'Falha ao criar item de receita.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Remove item de receita selecionado.
   */
  deleteSelectedRecipeItem() {
    if (!this.selectedProduct || !this.selectedRecipeItem) {
      return;
    }

    const selectedProductId = this.selectedProduct.id;
    const recipeItem = this.selectedRecipeItem;
    const confirmed = window.confirm(
      `Deseja remover o insumo "${recipeItem.ingredient.name}" da receita?`,
    );
    if (!confirmed) {
      return;
    }

    this.isSavingRecipeItem = true;
    this.recipeErrorMessage = '';
    this.recipeSuccessMessage = '';

    this.adminMenuService.deleteRecipeItem(selectedProductId, recipeItem.id).subscribe({
      next: () => {
        this.isSavingRecipeItem = false;
        this.recipeSuccessMessage = 'Item de receita removido com sucesso.';
        this.loadProductComposition(selectedProductId, false, true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingRecipeItem = false;
        this.recipeErrorMessage = this.resolveErrorMessage(
          error,
          'Falha ao remover item de receita.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Seleciona extra para edicao.
   */
  selectProductExtra(extraId: number) {
    const productExtra = this.productExtras.find((item) => item.id === extraId) ?? null;
    this.applyProductExtraSelection(productExtra);
  }

  /**
   * Prepara formulario para criacao de extra.
   */
  startNewProductExtra() {
    this.applyProductExtraSelection(null);
  }

  /**
   * Ajusta formulario quando vinculo de insumo do extra muda.
   */
  onProductExtraIngredientChange() {
    if (this.productExtraForm.ingredientId !== null) {
      return;
    }

    this.productExtraForm.ingredientQuantity = null;
    this.productExtraForm.ingredientUnit = '';
  }

  /**
   * Persiste extra como criacao ou atualizacao.
   */
  saveProductExtra() {
    if (!this.selectedProduct) {
      this.productExtraErrorMessage = 'Selecione um produto antes de editar extras.';
      return;
    }

    const normalizedName = this.productExtraForm.name.trim();
    if (!normalizedName) {
      this.productExtraErrorMessage = 'Nome do extra e obrigatorio.';
      return;
    }

    this.isSavingProductExtra = true;
    this.productExtraErrorMessage = '';
    this.productExtraSuccessMessage = '';

    const selectedProductId = this.selectedProduct.id;
    if (this.selectedProductExtra) {
      const payload = this.buildUpdateProductExtraPayload();
      this.adminMenuService
        .updateProductExtra(selectedProductId, this.selectedProductExtra.id, payload)
        .subscribe({
          next: () => {
            this.isSavingProductExtra = false;
            this.productExtraSuccessMessage = 'Extra atualizado com sucesso.';
            this.loadProductComposition(selectedProductId, true, true);
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.isSavingProductExtra = false;
            this.productExtraErrorMessage = this.resolveErrorMessage(
              error,
              'Falha ao atualizar extra.',
            );
            this.cdr.detectChanges();
          },
        });
      return;
    }

    const payload = this.buildCreateProductExtraPayload();
    this.adminMenuService.createProductExtra(selectedProductId, payload).subscribe({
      next: () => {
        this.isSavingProductExtra = false;
        this.productExtraSuccessMessage = 'Extra criado com sucesso.';
        this.loadProductComposition(selectedProductId, true, false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingProductExtra = false;
        this.productExtraErrorMessage = this.resolveErrorMessage(error, 'Falha ao criar extra.');
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Remove extra selecionado do produto.
   */
  deleteSelectedProductExtra() {
    if (!this.selectedProduct || !this.selectedProductExtra) {
      return;
    }

    const selectedProductId = this.selectedProduct.id;
    const productExtra = this.selectedProductExtra;
    const confirmed = window.confirm(`Deseja remover o extra "${productExtra.name}"?`);
    if (!confirmed) {
      return;
    }

    this.isSavingProductExtra = true;
    this.productExtraErrorMessage = '';
    this.productExtraSuccessMessage = '';

    this.adminMenuService.deleteProductExtra(selectedProductId, productExtra.id).subscribe({
      next: () => {
        this.isSavingProductExtra = false;
        this.productExtraSuccessMessage = 'Extra removido com sucesso.';
        this.loadProductComposition(selectedProductId, true, false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingProductExtra = false;
        this.productExtraErrorMessage = this.resolveErrorMessage(
          error,
          'Falha ao remover extra.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Traduz disponibilidade para rotulo legivel.
   */
  getAvailabilityLabel(product: AdminMenuProduct) {
    return product.availability.available ? 'Disponivel' : 'Indisponivel';
  }

  /**
   * Resolve classes visuais de disponibilidade por produto.
   */
  getAvailabilityBadgeClass(product: AdminMenuProduct) {
    return product.availability.available
      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      : 'bg-red-100 text-red-700 border border-red-200';
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
   * Converte string numerica para numero seguro no template.
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
   * Sincroniza selecao de categoria apos recarga.
   */
  private syncCategorySelection(preserveSelection: boolean) {
    if (!preserveSelection || !this.selectedCategory) {
      return;
    }

    const selectedFromList =
      this.categories.find((category) => category.id === this.selectedCategory?.id) ?? null;
    this.applyCategorySelection(selectedFromList);
  }

  /**
   * Aplica categoria selecionada e sincroniza formulario.
   */
  private applyCategorySelection(category: AdminMenuCategory | null) {
    this.selectedCategory = category;
    this.categoryForm = category ? this.mapCategoryToForm(category) : this.createEmptyCategoryForm();
    this.categoryErrorMessage = '';
    this.categorySuccessMessage = '';
  }

  /**
   * Sincroniza selecao de produto apos recarga.
   */
  private syncProductSelection(preserveSelection: boolean) {
    if (!preserveSelection || !this.selectedProduct) {
      return;
    }

    const selectedFromList =
      this.products.find((product) => product.id === this.selectedProduct?.id) ?? null;
    this.applyProductSelection(selectedFromList, true);
  }

  /**
   * Aplica produto selecionado e prepara formularios vinculados.
   */
  private applyProductSelection(product: AdminMenuProduct | null, preserveNestedSelection: boolean) {
    this.selectedProduct = product;
    this.productForm = product ? this.mapProductToForm(product) : this.createEmptyProductForm();
    this.productErrorMessage = '';
    this.productSuccessMessage = '';

    if (!product) {
      this.isLoadingProductComposition = false;
      this.recipeItems = [];
      this.productExtras = [];
      this.applyRecipeItemSelection(null);
      this.applyProductExtraSelection(null);
      return;
    }

    this.loadProductComposition(
      product.id,
      preserveNestedSelection,
      preserveNestedSelection,
    );
  }

  /**
   * Carrega receita e extras do produto selecionado em paralelo.
   *
   * Motivo:
   * ambas as listas dependem do mesmo contexto de produto; buscar em paralelo
   * reduz latencia da tela e evita duas esperas sequenciais.
   */
  private loadProductComposition(
    productId: number,
    preserveRecipeSelection: boolean,
    preserveProductExtraSelection: boolean,
  ) {
    this.isLoadingProductComposition = true;
    this.recipeErrorMessage = '';
    this.productExtraErrorMessage = '';

    forkJoin({
      recipeItems: this.adminMenuService.listRecipeItems(productId),
      productExtras: this.adminMenuService.listProductExtras(productId),
    }).subscribe({
      next: ({ recipeItems, productExtras }) => {
        // Validamos se o produto ainda esta selecionado para impedir que
        // resposta atrasada sobrescreva dados de outra selecao.
        if (!this.isCurrentSelectedProduct(productId)) {
          return;
        }

        this.isLoadingProductComposition = false;
        this.recipeItems = recipeItems;
        this.productExtras = productExtras;
        this.syncRecipeSelection(preserveRecipeSelection);
        this.syncProductExtraSelection(preserveProductExtraSelection);
        this.patchSelectedProductSnapshots(productId);
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (!this.isCurrentSelectedProduct(productId)) {
          return;
        }

        this.isLoadingProductComposition = false;
        this.recipeItems = [];
        this.productExtras = [];
        this.applyRecipeItemSelection(null);
        this.applyProductExtraSelection(null);
        this.recipeErrorMessage = this.resolveErrorMessage(
          error,
          'Nao foi possivel carregar a receita do produto.',
        );
        this.productExtraErrorMessage = this.resolveErrorMessage(
          error,
          'Nao foi possivel carregar os extras do produto.',
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Verifica se o produto informado continua selecionado.
   */
  private isCurrentSelectedProduct(productId: number) {
    return this.selectedProduct?.id === productId;
  }

  /**
   * Atualiza snapshot do produto selecionado com dados recarregados da lista.
   */
  private patchSelectedProductSnapshots(productId: number) {
    const updatedProduct =
      this.products.find((product) => product.id === productId) ?? this.selectedProduct;
    if (!updatedProduct) {
      return;
    }

    this.selectedProduct = updatedProduct;
  }

  /**
   * Sincroniza item de receita selecionado apos recarga.
   */
  private syncRecipeSelection(preserveSelection: boolean) {
    if (preserveSelection && this.selectedRecipeItem) {
      const selectedFromList =
        this.recipeItems.find((item) => item.id === this.selectedRecipeItem?.id) ?? null;
      this.applyRecipeItemSelection(selectedFromList);
      return;
    }

    this.applyRecipeItemSelection(null);
  }

  /**
   * Aplica item de receita selecionado e prepara formulario.
   */
  private applyRecipeItemSelection(recipeItem: AdminMenuRecipeItem | null) {
    this.selectedRecipeItem = recipeItem;
    this.recipeForm = recipeItem ? this.mapRecipeItemToForm(recipeItem) : this.createEmptyRecipeForm();
    this.recipeErrorMessage = '';
    this.recipeSuccessMessage = '';
  }

  /**
   * Sincroniza extra selecionado apos recarga.
   */
  private syncProductExtraSelection(preserveSelection: boolean) {
    if (preserveSelection && this.selectedProductExtra) {
      const selectedFromList =
        this.productExtras.find((item) => item.id === this.selectedProductExtra?.id) ?? null;
      this.applyProductExtraSelection(selectedFromList);
      return;
    }

    this.applyProductExtraSelection(null);
  }

  /**
   * Aplica extra selecionado e prepara formulario.
   */
  private applyProductExtraSelection(productExtra: AdminMenuProductExtra | null) {
    this.selectedProductExtra = productExtra;
    this.productExtraForm = productExtra
      ? this.mapProductExtraToForm(productExtra)
      : this.createEmptyProductExtraForm();
    this.productExtraErrorMessage = '';
    this.productExtraSuccessMessage = '';
  }

  /**
   * Mapeia categoria para formulario editavel.
   */
  private mapCategoryToForm(category: AdminMenuCategory): CategoryFormModel {
    return {
      name: category.name,
      slug: category.slug,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    };
  }

  /**
   * Mapeia produto para formulario editavel.
   */
  private mapProductToForm(product: AdminMenuProduct): ProductFormModel {
    return {
      name: product.name,
      description: product.description ?? '',
      price: this.toNumber(product.price),
      imageUrl: product.imageUrl ?? '',
      categoryId: product.categoryId,
      isActive: product.isActive,
    };
  }

  /**
   * Mapeia item de receita para formulario editavel.
   */
  private mapRecipeItemToForm(recipeItem: AdminMenuRecipeItem): RecipeFormModel {
    return {
      ingredientId: recipeItem.ingredientId,
      quantity: this.toNumber(recipeItem.quantity),
      unit: recipeItem.unit ?? '',
    };
  }

  /**
   * Mapeia extra para formulario editavel.
   */
  private mapProductExtraToForm(productExtra: AdminMenuProductExtra): ProductExtraFormModel {
    return {
      name: productExtra.name,
      price: this.toNumber(productExtra.price),
      sortOrder: productExtra.sortOrder,
      isActive: productExtra.isActive,
      ingredientId: productExtra.ingredientId,
      ingredientQuantity: this.toOptionalNumber(productExtra.ingredientQuantity),
      ingredientUnit: productExtra.ingredientUnit ?? '',
    };
  }

  /**
   * Monta payload de criacao de extra.
   */
  private buildCreateProductExtraPayload(): CreateAdminMenuProductExtraPayload {
    const payload: CreateAdminMenuProductExtraPayload = {
      name: this.productExtraForm.name.trim(),
      price: this.normalizeNonNegativeNumber(this.productExtraForm.price),
      sortOrder: this.normalizeInteger(this.productExtraForm.sortOrder, 0),
      isActive: this.productExtraForm.isActive,
    };

    if (this.productExtraForm.ingredientId !== null) {
      payload.ingredientId = this.productExtraForm.ingredientId;
      payload.ingredientQuantity = this.normalizePositiveNumber(
        this.productExtraForm.ingredientQuantity,
        0.001,
      );
      payload.ingredientUnit = this.productExtraForm.ingredientUnit.trim() || undefined;
    }

    return payload;
  }

  /**
   * Monta payload de atualizacao de extra.
   */
  private buildUpdateProductExtraPayload(): UpdateAdminMenuProductExtraPayload {
    const payload: UpdateAdminMenuProductExtraPayload = {
      name: this.productExtraForm.name.trim(),
      price: this.normalizeNonNegativeNumber(this.productExtraForm.price),
      sortOrder: this.normalizeInteger(this.productExtraForm.sortOrder, 0),
      isActive: this.productExtraForm.isActive,
    };

    if (this.productExtraForm.ingredientId === null) {
      payload.ingredientId = null;
      return payload;
    }

    payload.ingredientId = this.productExtraForm.ingredientId;
    payload.ingredientQuantity = this.normalizePositiveNumber(
      this.productExtraForm.ingredientQuantity,
      0.001,
    );
    payload.ingredientUnit = this.productExtraForm.ingredientUnit.trim() || undefined;
    return payload;
  }

  /**
   * Cria estado inicial do formulario de categoria.
   */
  private createEmptyCategoryForm(): CategoryFormModel {
    return {
      name: '',
      slug: '',
      sortOrder: 0,
      isActive: true,
    };
  }

  /**
   * Cria estado inicial do formulario de produto.
   */
  private createEmptyProductForm(): ProductFormModel {
    return {
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      categoryId: null,
      isActive: true,
    };
  }

  /**
   * Cria estado inicial do formulario de item de receita.
   */
  private createEmptyRecipeForm(): RecipeFormModel {
    return {
      ingredientId: null,
      quantity: 0.001,
      unit: '',
    };
  }

  /**
   * Cria estado inicial do formulario de extra.
   */
  private createEmptyProductExtraForm(): ProductExtraFormModel {
    return {
      name: '',
      price: 0,
      sortOrder: 0,
      isActive: true,
      ingredientId: null,
      ingredientQuantity: null,
      ingredientUnit: '',
    };
  }

  /**
   * Normaliza valores numericos opcionais para numero.
   */
  private toOptionalNumber(value: string | number | null | undefined) {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  /**
   * Normaliza valor inteiro com minimo configuravel.
   */
  private normalizeInteger(value: number | null | undefined, minimum: number) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(minimum, Math.floor(value));
    }

    return minimum;
  }

  /**
   * Normaliza valor monetario nao negativo.
   */
  private normalizeNonNegativeNumber(value: number | null | undefined) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value;
    }

    return 0;
  }

  /**
   * Normaliza valor decimal positivo.
   */
  private normalizePositiveNumber(value: number | null | undefined, fallback: number) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }

    return fallback;
  }

  /**
   * Gera slug amigavel para URLs e identificadores de categoria.
   */
  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Resolve mensagem de erro amigavel a partir da resposta HTTP.
   */
  private resolveErrorMessage(error: unknown, fallbackMessage: string) {
    const httpLikeError = error as { error?: { message?: unknown } } | undefined;
    const apiMessage = httpLikeError?.error?.message;
    return typeof apiMessage === 'string' ? apiMessage : fallbackMessage;
  }
}
