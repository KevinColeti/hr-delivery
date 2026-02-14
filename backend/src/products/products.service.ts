import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { ProductIngredient } from '../entities/product-ingredient.entity';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
/**
 * Servico de produtos.
 *
 * Alem do CRUD, calcula disponibilidade operacional baseada na receita
 * e no estoque atual de insumos.
 */
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(ProductIngredient)
    private readonly productIngredientsRepository: Repository<ProductIngredient>,
  ) {}

  /**
   * Lista produtos com categoria e disponibilidade calculada.
   */
  async findAll() {
    const products = await this.productsRepository.find({
      relations: { category: true },
      order: { name: 'ASC' },
    });

    return Promise.all(products.map((product) => this.withAvailability(product)));
  }

  /**
   * Retorna produto por id com disponibilidade calculada.
   */
  async findOne(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Produto nao encontrado');
    }

    return this.withAvailability(product);
  }

  /**
   * Cria produto validando categoria e unicidade de nome por categoria.
   */
  async create(dto: CreateProductDto) {
    await this.ensureCategoryExists(dto.categoryId);
    await this.ensureUniqueNameInCategory(dto.name, dto.categoryId);

    const product = this.productsRepository.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      price: this.toDbPrice(dto.price),
      imageUrl: dto.imageUrl?.trim() || null,
      categoryId: dto.categoryId,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.productsRepository.save(product);
    return this.findOne(saved.id);
  }

  /**
   * Atualiza produto e revalida regras de nome/categoria quando necessario.
   */
  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    const nextCategoryId = dto.categoryId ?? product.categoryId;
    const nextName = dto.name ?? product.name;

    if (dto.categoryId !== undefined) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    if (dto.name !== undefined || dto.categoryId !== undefined) {
      await this.ensureUniqueNameInCategory(nextName, nextCategoryId, id);
    }

    const merged = this.productsRepository.merge(product, {
      name: dto.name?.trim(),
      description: dto.description !== undefined ? dto.description.trim() : product.description,
      price: dto.price !== undefined ? this.toDbPrice(dto.price) : product.price,
      imageUrl: dto.imageUrl !== undefined ? dto.imageUrl.trim() : product.imageUrl,
      categoryId: nextCategoryId,
      isActive: dto.isActive ?? product.isActive,
    });

    await this.productsRepository.save(merged);
    return this.findOne(id);
  }

  /**
   * Remove produto por id.
   */
  async remove(id: number) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto nao encontrado');
    }
    await this.productsRepository.remove(product);
    return { success: true };
  }

  /**
   * Retorna apenas o bloco de disponibilidade de um produto.
   */
  async getAvailability(id: number) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto nao encontrado');
    }
    return this.calculateProductAvailability(product.id);
  }

  /**
   * Verifica se a categoria alvo existe.
   */
  private async ensureCategoryExists(categoryId: number) {
    const category = await this.categoriesRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new BadRequestException('Categoria informada nao existe');
    }
  }

  /**
   * Garante unicidade de nome dentro da mesma categoria.
   */
  private async ensureUniqueNameInCategory(name: string, categoryId: number, exceptId?: number) {
    const query = this.productsRepository
      .createQueryBuilder('product')
      .where('LOWER(product.name) = LOWER(:name)', { name })
      .andWhere('product.category_id = :categoryId', { categoryId });

    if (exceptId) {
      query.andWhere('product.id != :exceptId', { exceptId });
    }

    const existing = await query.getOne();
    if (existing) {
      throw new ConflictException('Ja existe produto com este nome nesta categoria');
    }
  }

  /**
   * Normaliza preco para armazenamento em coluna decimal.
   */
  private toDbPrice(value: number): string {
    return value.toFixed(2);
  }

  /**
   * Anexa disponibilidade calculada ao payload do produto.
   */
  private async withAvailability(product: Product) {
    const availability = await this.calculateProductAvailability(product.id);
    return {
      ...product,
      availability,
    };
  }

  /**
   * Calcula disponibilidade com base na receita para 1 unidade.
   *
   * Motivo: avaliamos disponibilidade por unidade para ter uma regra simples
   * e previsivel para listagem/catalogo em tempo real.
   */
  private async calculateProductAvailability(productId: number) {
    const recipeItems = await this.productIngredientsRepository.find({
      where: { productId },
      relations: { ingredient: true },
    });

    if (recipeItems.length === 0) {
      return {
        available: false,
        reason: 'Produto sem receita cadastrada',
        missingIngredients: [],
      };
    }

    const missingIngredients = recipeItems
      .filter((item) => Number(item.ingredient.stockQuantity) < Number(item.quantity))
      .map((item) => ({
        ingredientId: item.ingredientId,
        name: item.ingredient.name,
        required: Number(item.quantity),
        currentStock: Number(item.ingredient.stockQuantity),
        unit: item.unit,
      }));

    return {
      available: missingIngredients.length === 0,
      reason:
        missingIngredients.length === 0
          ? 'Disponivel'
          : 'Estoque insuficiente para produzir 1 unidade',
      missingIngredients,
    };
  }
}
