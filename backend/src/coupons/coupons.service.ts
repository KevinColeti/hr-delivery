import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponDiscountType } from '../entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
/**
 * Regras de negocio de cupons promocionais.
 */
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
  ) {}

  /**
   * Lista cupons com ordenacao operacional.
   */
  findAll() {
    return this.couponsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca cupom por id.
   */
  async findOne(id: number) {
    const coupon = await this.couponsRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Cupom nao encontrado');
    }
    return coupon;
  }

  /**
   * Cria cupom com validacoes de consistencia.
   */
  async create(dto: CreateCouponDto) {
    const normalizedCode = this.normalizeCode(dto.code);
    await this.ensureUniqueCode(normalizedCode);
    this.validateCouponDates(dto.startsAt, dto.endsAt);
    this.validateDiscountShape(dto.discountType, dto.discountValue);

    const coupon = this.couponsRepository.create({
      code: normalizedCode,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      discountType: dto.discountType,
      discountValue: this.toMoney(dto.discountValue),
      minimumOrderAmount: this.toMoney(dto.minimumOrderAmount ?? 0),
      usageLimit: dto.usageLimit ?? null,
      usageCount: 0,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      isActive: dto.isActive ?? true,
      firstOrderOnly: dto.firstOrderOnly ?? false,
    });

    return this.couponsRepository.save(coupon);
  }

  /**
   * Atualiza cupom preservando integridade.
   */
  async update(id: number, dto: UpdateCouponDto) {
    const coupon = await this.findOne(id);
    const nextCode =
      dto.code !== undefined ? this.normalizeCode(dto.code) : coupon.code;

    if (dto.code !== undefined) {
      await this.ensureUniqueCode(nextCode, id);
    }

    const nextDiscountType = dto.discountType ?? coupon.discountType;
    const nextDiscountValue =
      dto.discountValue !== undefined
        ? dto.discountValue
        : Number(coupon.discountValue);

    this.validateCouponDates(
      dto.startsAt ?? coupon.startsAt?.toISOString(),
      dto.endsAt ?? coupon.endsAt?.toISOString(),
    );
    this.validateDiscountShape(nextDiscountType, nextDiscountValue);

    if (dto.usageLimit !== undefined && dto.usageLimit < coupon.usageCount) {
      throw new BadRequestException(
        'usageLimit nao pode ser menor que usageCount atual',
      );
    }

    const merged = this.couponsRepository.merge(coupon, {
      code: nextCode,
      name: dto.name?.trim(),
      description:
        dto.description !== undefined
          ? dto.description.trim() || null
          : coupon.description,
      discountType: dto.discountType,
      discountValue:
        dto.discountValue !== undefined
          ? this.toMoney(dto.discountValue)
          : coupon.discountValue,
      minimumOrderAmount:
        dto.minimumOrderAmount !== undefined
          ? this.toMoney(dto.minimumOrderAmount)
          : coupon.minimumOrderAmount,
      usageLimit:
        dto.usageLimit !== undefined ? dto.usageLimit : coupon.usageLimit,
      startsAt:
        dto.startsAt !== undefined ? (dto.startsAt ? new Date(dto.startsAt) : null) : coupon.startsAt,
      endsAt:
        dto.endsAt !== undefined ? (dto.endsAt ? new Date(dto.endsAt) : null) : coupon.endsAt,
      isActive: dto.isActive !== undefined ? dto.isActive : coupon.isActive,
      firstOrderOnly:
        dto.firstOrderOnly !== undefined
          ? dto.firstOrderOnly
          : coupon.firstOrderOnly,
    });

    return this.couponsRepository.save(merged);
  }

  /**
   * Remove cupom.
   */
  async remove(id: number) {
    const coupon = await this.findOne(id);
    await this.couponsRepository.remove(coupon);
    return { success: true };
  }

  /**
   * Valida formato de desconto por tipo.
   */
  private validateDiscountShape(type: CouponDiscountType, value: number) {
    if (type === CouponDiscountType.PERCENTAGE && value > 100) {
      throw new BadRequestException(
        'Cupom percentual nao pode ter discountValue maior que 100',
      );
    }
  }

  /**
   * Valida intervalo de vigencia.
   */
  private validateCouponDates(startsAt?: string | null, endsAt?: string | null) {
    if (!startsAt || !endsAt) {
      return;
    }

    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (end < start) {
      throw new BadRequestException('endsAt nao pode ser menor que startsAt');
    }
  }

  /**
   * Impede duplicidade de codigo.
   */
  private async ensureUniqueCode(code: string, exceptId?: number) {
    const qb = this.couponsRepository
      .createQueryBuilder('coupon')
      .where('LOWER(coupon.code) = LOWER(:code)', { code });

    if (exceptId) {
      qb.andWhere('coupon.id != :exceptId', { exceptId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException('Ja existe um cupom com este codigo');
    }
  }

  /**
   * Normaliza codigo para comparacao consistente.
   */
  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  /**
   * Formata decimal monetario para persistencia.
   */
  private toMoney(value: number) {
    return value.toFixed(2);
  }
}
