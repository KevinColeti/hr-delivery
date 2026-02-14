import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from '../entities/ingredient.entity';
import { ProductIngredient } from '../entities/product-ingredient.entity';
import { Product } from '../entities/product.entity';
import { CreateProductIngredientDto } from './dto/create-product-ingredient.dto';
import { UpdateProductIngredientDto } from './dto/update-product-ingredient.dto';

@Injectable()
/**
 * Gerencia a receita base dos produtos (insumos obrigatorios).
 */
export class ProductIngredientsService {
  constructor(
    @InjectRepository(ProductIngredient)
    private readonly productIngredientsRepository: Repository<ProductIngredient>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Ingredient)
    private readonly ingredientsRepository: Repository<Ingredient>,
  ) {}

  /**
   * Lista itens de receita de um produto.
   */
  async findAllByProduct(productId: number) {
    await this.ensureProductExists(productId);

    return this.productIngredientsRepository.find({
      where: { productId },
      relations: { ingredient: true },
      order: { id: 'ASC' },
    });
  }

  /**
   * Cria item de receita para um produto.
   */
  async create(productId: number, dto: CreateProductIngredientDto) {
    await this.ensureProductExists(productId);
    const ingredient = await this.ensureIngredientExists(dto.ingredientId);
    await this.ensureIngredientNotLinked(productId, dto.ingredientId);

    const recipeItem = this.productIngredientsRepository.create({
      productId,
      ingredientId: dto.ingredientId,
      quantity: this.toDbNumeric(dto.quantity),
      unit: dto.unit?.trim().toLowerCase() ?? ingredient.unit,
    });

    const saved = await this.productIngredientsRepository.save(recipeItem);
    return this.findOne(productId, saved.id);
  }

  /**
   * Busca item de receita por id dentro do produto.
   */
  async findOne(productId: number, recipeItemId: number) {
    await this.ensureProductExists(productId);

    const recipeItem = await this.productIngredientsRepository.findOne({
      where: { id: recipeItemId, productId },
      relations: { ingredient: true },
    });

    if (!recipeItem) {
      throw new NotFoundException('Item da receita nao encontrado');
    }

    return recipeItem;
  }

  /**
   * Atualiza quantidade/unidade do item de receita.
   */
  async update(productId: number, recipeItemId: number, dto: UpdateProductIngredientDto) {
    const recipeItem = await this.findOne(productId, recipeItemId);

    const merged = this.productIngredientsRepository.merge(recipeItem, {
      quantity:
        dto.quantity !== undefined ? this.toDbNumeric(dto.quantity) : recipeItem.quantity,
      unit: dto.unit !== undefined ? dto.unit.trim().toLowerCase() : recipeItem.unit,
    });

    await this.productIngredientsRepository.save(merged);
    return this.findOne(productId, recipeItemId);
  }

  /**
   * Remove item de receita.
   */
  async remove(productId: number, recipeItemId: number) {
    const recipeItem = await this.findOne(productId, recipeItemId);
    await this.productIngredientsRepository.remove(recipeItem);
    return { success: true };
  }

  /**
   * Verifica existencia do produto pai.
   */
  private async ensureProductExists(productId: number) {
    const product = await this.productsRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new BadRequestException('Produto informado nao existe');
    }
  }

  /**
   * Verifica existencia do insumo vinculado.
   */
  private async ensureIngredientExists(ingredientId: number) {
    const ingredient = await this.ingredientsRepository.findOne({ where: { id: ingredientId } });
    if (!ingredient) {
      throw new BadRequestException('Insumo informado nao existe');
    }
    return ingredient;
  }

  /**
   * Evita duplicidade do mesmo insumo na receita do produto.
   */
  private async ensureIngredientNotLinked(productId: number, ingredientId: number) {
    const existing = await this.productIngredientsRepository.findOne({
      where: { productId, ingredientId },
    });

    if (existing) {
      throw new ConflictException('Este insumo ja esta vinculado a receita do produto');
    }
  }

  /**
   * Formata quantidade para coluna decimal.
   */
  private toDbNumeric(value: number): string {
    return value.toFixed(3);
  }
}
