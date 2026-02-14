import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComboRule, ComboRuleType } from '../entities/combo-rule.entity';
import { Combo, ComboDiscountType } from '../entities/combo.entity';
import { CreateComboDto } from './dto/create-combo.dto';
import { CreateComboRuleDto } from './dto/create-combo-rule.dto';
import { UpdateComboDto } from './dto/update-combo.dto';
import { UpdateComboRuleDto } from './dto/update-combo-rule.dto';

@Injectable()
/**
 * Regras de negocio de combos automaticos.
 */
export class CombosService {
  constructor(
    @InjectRepository(Combo)
    private readonly combosRepository: Repository<Combo>,
    @InjectRepository(ComboRule)
    private readonly comboRulesRepository: Repository<ComboRule>,
  ) {}

  /**
   * Lista combos com regras.
   */
  findAll() {
    return this.combosRepository.find({
      relations: { rules: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca combo por id.
   */
  async findOne(id: number) {
    const combo = await this.combosRepository.findOne({
      where: { id },
      relations: { rules: true },
    });

    if (!combo) {
      throw new NotFoundException('Combo nao encontrado');
    }

    return combo;
  }

  /**
   * Cria combo com validacoes de consistencia.
   */
  async create(dto: CreateComboDto) {
    this.validateDiscountShape(dto.discountType, dto.discountValue);
    this.validateDates(dto.startsAt, dto.endsAt);

    const combo = this.combosRepository.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      discountType: dto.discountType,
      discountValue: this.toMoney(dto.discountValue),
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      isActive: dto.isActive ?? true,
    });

    return this.combosRepository.save(combo);
  }

  /**
   * Atualiza combo.
   */
  async update(id: number, dto: UpdateComboDto) {
    const combo = await this.findOne(id);

    const nextType = dto.discountType ?? combo.discountType;
    const nextValue =
      dto.discountValue !== undefined ? dto.discountValue : Number(combo.discountValue);

    this.validateDiscountShape(nextType, nextValue);
    this.validateDates(
      dto.startsAt ?? combo.startsAt?.toISOString(),
      dto.endsAt ?? combo.endsAt?.toISOString(),
    );

    const merged = this.combosRepository.merge(combo, {
      name: dto.name?.trim(),
      description:
        dto.description !== undefined
          ? dto.description.trim() || null
          : combo.description,
      discountType: dto.discountType,
      discountValue:
        dto.discountValue !== undefined
          ? this.toMoney(dto.discountValue)
          : combo.discountValue,
      startsAt:
        dto.startsAt !== undefined ? (dto.startsAt ? new Date(dto.startsAt) : null) : combo.startsAt,
      endsAt:
        dto.endsAt !== undefined ? (dto.endsAt ? new Date(dto.endsAt) : null) : combo.endsAt,
      isActive: dto.isActive !== undefined ? dto.isActive : combo.isActive,
    });

    return this.combosRepository.save(merged);
  }

  /**
   * Remove combo.
   */
  async remove(id: number) {
    const combo = await this.findOne(id);
    await this.combosRepository.remove(combo);
    return { success: true };
  }

  /**
   * Lista regras de um combo.
   */
  async listRules(comboId: number) {
    await this.findOne(comboId);
    return this.comboRulesRepository.find({
      where: { comboId },
      order: { id: 'ASC' },
    });
  }

  /**
   * Busca regra de combo por id.
   */
  async findRule(comboId: number, ruleId: number) {
    const rule = await this.comboRulesRepository.findOne({
      where: { id: ruleId, comboId },
    });

    if (!rule) {
      throw new NotFoundException('Regra de combo nao encontrada');
    }

    return rule;
  }

  /**
   * Cria regra de combo.
   */
  async createRule(comboId: number, dto: CreateComboRuleDto) {
    await this.findOne(comboId);
    this.validateRuleShape(dto.type, dto.productId, dto.categoryId);

    const rule = this.comboRulesRepository.create({
      comboId,
      type: dto.type,
      productId: dto.productId ?? null,
      categoryId: dto.categoryId ?? null,
      minimumQuantity: dto.minimumQuantity,
    });

    return this.comboRulesRepository.save(rule);
  }

  /**
   * Atualiza regra de combo.
   */
  async updateRule(comboId: number, ruleId: number, dto: UpdateComboRuleDto) {
    const rule = await this.findRule(comboId, ruleId);
    const nextType = dto.type ?? rule.type;
    const nextProductId =
      dto.productId !== undefined ? dto.productId : rule.productId ?? undefined;
    const nextCategoryId =
      dto.categoryId !== undefined ? dto.categoryId : rule.categoryId ?? undefined;

    this.validateRuleShape(nextType, nextProductId, nextCategoryId);

    const merged = this.comboRulesRepository.merge(rule, {
      type: dto.type,
      productId: dto.productId !== undefined ? dto.productId : rule.productId,
      categoryId:
        dto.categoryId !== undefined ? dto.categoryId : rule.categoryId,
      minimumQuantity:
        dto.minimumQuantity !== undefined
          ? dto.minimumQuantity
          : rule.minimumQuantity,
    });

    return this.comboRulesRepository.save(merged);
  }

  /**
   * Remove regra.
   */
  async removeRule(comboId: number, ruleId: number) {
    const rule = await this.findRule(comboId, ruleId);
    await this.comboRulesRepository.remove(rule);
    return { success: true };
  }

  /**
   * Valida formato de desconto.
   */
  private validateDiscountShape(type: ComboDiscountType, value: number) {
    if (type === ComboDiscountType.PERCENTAGE && value > 100) {
      throw new BadRequestException(
        'Combo percentual nao pode ter discountValue maior que 100',
      );
    }
  }

  /**
   * Valida janela de vigencia.
   */
  private validateDates(startsAt?: string | null, endsAt?: string | null) {
    if (!startsAt || !endsAt) {
      return;
    }

    if (new Date(endsAt) < new Date(startsAt)) {
      throw new BadRequestException('endsAt nao pode ser menor que startsAt');
    }
  }

  /**
   * Valida se regra aponta para alvo correto.
   */
  private validateRuleShape(
    type: ComboRuleType,
    productId?: number | null,
    categoryId?: number | null,
  ) {
    if (type === ComboRuleType.PRODUCT) {
      if (!productId) {
        throw new BadRequestException(
          'Regra do tipo product exige productId',
        );
      }
      if (categoryId) {
        throw new BadRequestException(
          'Regra do tipo product nao aceita categoryId',
        );
      }
      return;
    }

    if (!categoryId) {
      throw new BadRequestException('Regra do tipo category exige categoryId');
    }
    if (productId) {
      throw new BadRequestException(
        'Regra do tipo category nao aceita productId',
      );
    }
  }

  /**
   * Formata valor monetario.
   */
  private toMoney(value: number) {
    return value.toFixed(2);
  }
}
