import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from '../entities/ingredient.entity';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { ListLowStockAlertsQueryDto } from './dto/list-low-stock-alerts-query.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
/**
 * Regras de negocio dos insumos de estoque.
 */
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientsRepository: Repository<Ingredient>,
  ) {}

  /**
   * Lista insumos ordenados por nome.
   */
  findAll() {
    return this.ingredientsRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Lista alertas de estoque minimo para operacao.
   *
   * Regra do alerta:
   * - `below_minimum`: estoque maior que 0 e menor/igual ao minimo;
   * - `out_of_stock`: estoque igual a 0.
   */
  async findLowStockAlerts(query: ListLowStockAlertsQueryDto) {
    const qb = this.ingredientsRepository
      .createQueryBuilder('ingredient')
      .where('ingredient.stockQuantity <= ingredient.minimumQuantity')
      .orderBy('ingredient.stockQuantity', 'ASC')
      .addOrderBy('ingredient.name', 'ASC')
      .take(query.limit ?? 100);

    if (!query.includeInactive) {
      qb.andWhere('ingredient.isActive = :isActive', { isActive: true });
    }

    const ingredients = await qb.getMany();

    return ingredients.map((ingredient) => {
      const stockQuantity = Number(ingredient.stockQuantity);
      const minimumQuantity = Number(ingredient.minimumQuantity);
      const deficitQuantity = Math.max(minimumQuantity - stockQuantity, 0);

      return {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        unit: ingredient.unit,
        isActive: ingredient.isActive,
        stockQuantity: ingredient.stockQuantity,
        minimumQuantity: ingredient.minimumQuantity,
        deficitQuantity: deficitQuantity.toFixed(3),
        alertLevel: stockQuantity === 0 ? 'out_of_stock' : 'below_minimum',
      };
    });
  }

  /**
   * Busca insumo por id.
   */
  async findOne(id: number) {
    const ingredient = await this.ingredientsRepository.findOne({ where: { id } });
    if (!ingredient) {
      throw new NotFoundException('Insumo nao encontrado');
    }
    return ingredient;
  }

  /**
   * Cria insumo com normalizacao de unidade e quantidades.
   */
  async create(dto: CreateIngredientDto) {
    await this.ensureUniqueName(dto.name);

    const ingredient = this.ingredientsRepository.create({
      name: dto.name.trim(),
      unit: dto.unit.trim().toLowerCase(),
      stockQuantity: this.toDbNumeric(dto.stockQuantity ?? 0),
      minimumQuantity: this.toDbNumeric(dto.minimumQuantity ?? 0),
      isActive: dto.isActive ?? true,
    });

    return this.ingredientsRepository.save(ingredient);
  }

  /**
   * Atualiza insumo mantendo formato decimal padrao.
   */
  async update(id: number, dto: UpdateIngredientDto) {
    const ingredient = await this.findOne(id);

    if (dto.name) {
      await this.ensureUniqueName(dto.name, id);
    }

    const merged = this.ingredientsRepository.merge(ingredient, {
      ...dto,
      name: dto.name?.trim(),
      unit: dto.unit?.trim().toLowerCase(),
      stockQuantity:
        dto.stockQuantity !== undefined
          ? this.toDbNumeric(dto.stockQuantity)
          : ingredient.stockQuantity,
      minimumQuantity:
        dto.minimumQuantity !== undefined
          ? this.toDbNumeric(dto.minimumQuantity)
          : ingredient.minimumQuantity,
    });

    return this.ingredientsRepository.save(merged);
  }

  /**
   * Remove insumo por id.
   */
  async remove(id: number) {
    const ingredient = await this.findOne(id);
    await this.ingredientsRepository.remove(ingredient);
    return { success: true };
  }

  /**
   * Evita duplicidade de nome de insumo.
   */
  private async ensureUniqueName(name: string, exceptId?: number) {
    const query = this.ingredientsRepository
      .createQueryBuilder('ingredient')
      .where('LOWER(ingredient.name) = LOWER(:name)', { name });

    if (exceptId) {
      query.andWhere('ingredient.id != :exceptId', { exceptId });
    }

    const existing = await query.getOne();
    if (existing) {
      throw new ConflictException('Ja existe um insumo com este nome');
    }
  }

  /**
   * Padroniza quantidade para coluna decimal do banco.
   */
  private toDbNumeric(value: number): string {
    return value.toFixed(3);
  }
}
