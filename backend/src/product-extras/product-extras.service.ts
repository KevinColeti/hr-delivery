import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from '../entities/ingredient.entity';
import { ProductExtra } from '../entities/product-extra.entity';
import { Product } from '../entities/product.entity';
import { CreateProductExtraDto } from './dto/create-product-extra.dto';
import { UpdateProductExtraDto } from './dto/update-product-extra.dto';

@Injectable()
/**
 * Gerencia extras de produto.
 *
 * Extras podem ter (ou nao) consumo de insumo vinculado para suportar
 * opcoes que impactam estoque.
 */
export class ProductExtrasService {
  constructor(
    @InjectRepository(ProductExtra)
    private readonly productExtrasRepository: Repository<ProductExtra>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Ingredient)
    private readonly ingredientsRepository: Repository<Ingredient>,
  ) {}

  /**
   * Lista extras de um produto.
   */
  async findAllByProduct(productId: number) {
    await this.ensureProductExists(productId);

    return this.productExtrasRepository.find({
      where: { productId },
      relations: { ingredient: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  /**
   * Retorna um extra especifico de um produto.
   */
  async findOne(productId: number, extraId: number) {
    await this.ensureProductExists(productId);

    const extra = await this.productExtrasRepository.findOne({
      where: { id: extraId, productId },
      relations: { ingredient: true },
    });

    if (!extra) {
      throw new NotFoundException('Extra nao encontrado para este produto');
    }

    return extra;
  }

  /**
   * Cria um extra para um produto.
   *
   * Quando houver `ingredientId`, exigimos `ingredientQuantity` para
   * impedir cadastro de extra "incompleto" que quebraria baixa de estoque.
   */
  async create(productId: number, dto: CreateProductExtraDto) {
    await this.ensureProductExists(productId);
    await this.ensureUniqueName(productId, dto.name);
    const ingredient = await this.resolveIngredient(dto.ingredientId);

    if (dto.ingredientId && !dto.ingredientQuantity) {
      throw new BadRequestException(
        'ingredientQuantity e obrigatoria quando ingredientId for informado',
      );
    }

    const extra = this.productExtrasRepository.create({
      productId,
      name: dto.name.trim(),
      price: this.toDbPrice(dto.price),
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      ingredientId: ingredient?.id ?? null,
      ingredientQuantity:
        dto.ingredientQuantity !== undefined
          ? this.toDbQuantity(dto.ingredientQuantity)
          : null,
      ingredientUnit: dto.ingredientUnit?.trim().toLowerCase() ?? ingredient?.unit ?? null,
    });

    const saved = await this.productExtrasRepository.save(extra);
    return this.findOne(productId, saved.id);
  }

  /**
   * Atualiza extra e revalida regras de consistencia com insumo vinculado.
   */
  async update(productId: number, extraId: number, dto: UpdateProductExtraDto) {
    const extra = await this.findOne(productId, extraId);
    const nextName = dto.name ?? extra.name;

    if (dto.name) {
      await this.ensureUniqueName(productId, nextName, extraId);
    }

    const nextIngredientId =
      dto.ingredientId !== undefined ? dto.ingredientId : extra.ingredientId ?? undefined;
    const ingredient = await this.resolveIngredient(nextIngredientId);

    if (dto.ingredientId !== undefined && dto.ingredientId && dto.ingredientQuantity === undefined) {
      throw new BadRequestException(
        'ingredientQuantity e obrigatoria quando ingredientId for informado',
      );
    }

    const merged = this.productExtrasRepository.merge(extra, {
      name: dto.name?.trim(),
      price: dto.price !== undefined ? this.toDbPrice(dto.price) : extra.price,
      sortOrder: dto.sortOrder ?? extra.sortOrder,
      isActive: dto.isActive ?? extra.isActive,
      ingredientId: dto.ingredientId !== undefined ? dto.ingredientId : extra.ingredientId,
      ingredientQuantity:
        dto.ingredientQuantity !== undefined
          ? this.toDbQuantity(dto.ingredientQuantity)
          : extra.ingredientQuantity,
      ingredientUnit:
        dto.ingredientUnit !== undefined
          ? dto.ingredientUnit.trim().toLowerCase()
          : extra.ingredientUnit ?? ingredient?.unit ?? null,
    });

    if (!merged.ingredientId) {
      merged.ingredientQuantity = null;
      merged.ingredientUnit = null;
    }

    await this.productExtrasRepository.save(merged);
    return this.findOne(productId, extraId);
  }

  /**
   * Remove extra de produto.
   */
  async remove(productId: number, extraId: number) {
    const extra = await this.findOne(productId, extraId);
    await this.productExtrasRepository.remove(extra);
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
   * Evita nomes duplicados de extra no mesmo produto.
   */
  private async ensureUniqueName(productId: number, name: string, exceptId?: number) {
    const query = this.productExtrasRepository
      .createQueryBuilder('extra')
      .where('extra.product_id = :productId', { productId })
      .andWhere('LOWER(extra.name) = LOWER(:name)', { name });

    if (exceptId) {
      query.andWhere('extra.id != :exceptId', { exceptId });
    }

    const existing = await query.getOne();
    if (existing) {
      throw new ConflictException('Ja existe extra com este nome neste produto');
    }
  }

  /**
   * Resolve ingrediente vinculado, quando informado.
   */
  private async resolveIngredient(ingredientId?: number) {
    if (!ingredientId) {
      return null;
    }

    const ingredient = await this.ingredientsRepository.findOne({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      throw new BadRequestException('Insumo informado para o extra nao existe');
    }

    return ingredient;
  }

  /**
   * Formata preco para coluna decimal.
   */
  private toDbPrice(value: number): string {
    return value.toFixed(2);
  }

  /**
   * Formata quantidade para coluna decimal.
   */
  private toDbQuantity(value: number): string {
    return value.toFixed(3);
  }
}
