import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Client } from '../entities/client.entity';
import { Coupon, CouponDiscountType } from '../entities/coupon.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidatePublicCouponDto } from './dto/validate-public-coupon.dto';

export interface PublicCouponValidationResponse {
  valid: boolean;
  code: string;
  message: string;
  discountType: CouponDiscountType;
  discountValue: string;
  discountAmount: string;
  subtotal: string;
  finalSubtotal: string;
  minimumOrderAmount: string;
  firstOrderOnly: boolean;
}

@Injectable()
/**
 * Regras de negocio de cupons promocionais.
 */
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
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
   * Valida cupom para checkout publico sem consumir uso.
   *
   * Regras avaliadas:
   * - existencia, ativo e vigencia;
   * - pedido minimo e limite de uso;
   * - elegibilidade de primeiro pedido quando aplicavel.
   */
  async validateForPublicCheckout(
    dto: ValidatePublicCouponDto,
  ): Promise<PublicCouponValidationResponse> {
    const normalizedCode = this.normalizeCode(dto.code);
    const subtotal = this.toMoneyNumber(dto.subtotal);
    const coupon = await this.couponsRepository.findOne({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return this.buildInvalidPublicValidationResponse({
        code: normalizedCode,
        subtotal,
        message: 'Cupom informado nao existe',
      });
    }

    if (!coupon.isActive) {
      return this.buildInvalidPublicValidationResponse({
        coupon,
        subtotal,
        message: 'Cupom informado esta inativo',
      });
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return this.buildInvalidPublicValidationResponse({
        coupon,
        subtotal,
        message: 'Cupom ainda nao iniciou vigencia',
      });
    }

    if (coupon.endsAt && now > coupon.endsAt) {
      return this.buildInvalidPublicValidationResponse({
        coupon,
        subtotal,
        message: 'Cupom expirado',
      });
    }

    if (subtotal < Number(coupon.minimumOrderAmount)) {
      return this.buildInvalidPublicValidationResponse({
        coupon,
        subtotal,
        message: `Cupom exige pedido minimo de ${Number(coupon.minimumOrderAmount).toFixed(2)}`,
      });
    }

    const requiresClientPhone = coupon.firstOrderOnly || coupon.usageLimit !== null;
    const normalizedPhone = requiresClientPhone
      ? this.normalizePhoneForPublicValidation(dto.clientPhone)
      : null;

    if (requiresClientPhone && !normalizedPhone) {
      return this.buildInvalidPublicValidationResponse({
        coupon,
        subtotal,
        message:
          'Informe um telefone valido para validar este cupom no checkout',
      });
    }

    if (coupon.usageLimit !== null && normalizedPhone) {
      const couponUsageByClient = await this.countCouponUsageByPhone(
        normalizedPhone,
        coupon.id,
      );
      if (couponUsageByClient >= coupon.usageLimit) {
        return this.buildInvalidPublicValidationResponse({
          coupon,
          subtotal,
          message: 'Cupom atingiu limite de uso para este cliente',
        });
      }
    }

    if (coupon.firstOrderOnly && normalizedPhone) {
      const previousOrdersCount = await this.countNonCanceledOrdersByPhone(
        normalizedPhone,
      );
      if (previousOrdersCount > 0) {
        return this.buildInvalidPublicValidationResponse({
          coupon,
          subtotal,
          message: 'Cupom valido apenas para primeiro pedido do cliente',
        });
      }
    }

    const discountAmount = this.calculateCouponDiscount(coupon, subtotal);
    const finalSubtotal = Math.max(subtotal - discountAmount, 0);

    return {
      valid: true,
      code: coupon.code,
      message: `Cupom ${coupon.code} valido para este pedido`,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: this.toMoney(discountAmount),
      subtotal: this.toMoney(subtotal),
      finalSubtotal: this.toMoney(finalSubtotal),
      minimumOrderAmount: coupon.minimumOrderAmount,
      firstOrderOnly: coupon.firstOrderOnly,
    };
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
   * Normaliza subtotal para escala monetaria segura.
   */
  private toMoneyNumber(value: number) {
    return Number(value.toFixed(2));
  }

  /**
   * Normaliza telefone para validacao de cupom first-order.
   */
  private normalizePhoneForPublicValidation(rawPhone?: string) {
    if (!rawPhone) {
      return null;
    }

    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 20) {
      return null;
    }

    return digitsOnly;
  }

  /**
   * Conta usos do cupom para um cliente identificado por telefone.
   */
  private async countCouponUsageByPhone(normalizedPhone: string, couponId: number) {
    const client = await this.clientsRepository.findOne({
      where: { phone: normalizedPhone },
    });
    if (!client) {
      return 0;
    }

    return this.ordersRepository.count({
      where: {
        clientId: client.id,
        appliedCouponId: couponId,
        status: Not(OrderStatus.CANCELED),
      },
    });
  }

  /**
   * Conta pedidos nao cancelados por telefone para regra de first-order.
   */
  private async countNonCanceledOrdersByPhone(normalizedPhone: string) {
    const client = await this.clientsRepository.findOne({
      where: { phone: normalizedPhone },
    });
    if (!client) {
      return 0;
    }

    return this.ordersRepository.count({
      where: {
        clientId: client.id,
        status: Not(OrderStatus.CANCELED),
      },
    });
  }

  /**
   * Calcula desconto de cupom com teto no subtotal informado.
   */
  private calculateCouponDiscount(coupon: Coupon, subtotal: number) {
    const discountValue = Number(coupon.discountValue);
    const rawDiscount =
      coupon.discountType === CouponDiscountType.PERCENTAGE
        ? (subtotal * discountValue) / 100
        : discountValue;

    return this.toMoneyNumber(Math.min(rawDiscount, subtotal));
  }

  /**
   * Monta resposta padrao para cupom invalido no checkout publico.
   */
  private buildInvalidPublicValidationResponse(params: {
    code?: string;
    coupon?: Coupon;
    subtotal: number;
    message: string;
  }): PublicCouponValidationResponse {
    const code = params.coupon?.code ?? params.code ?? '';
    const discountType = params.coupon?.discountType ?? CouponDiscountType.FIXED;
    const discountValue = params.coupon?.discountValue ?? this.toMoney(0);
    const minimumOrderAmount = params.coupon?.minimumOrderAmount ?? this.toMoney(0);
    const firstOrderOnly = params.coupon?.firstOrderOnly ?? false;

    return {
      valid: false,
      code,
      message: params.message,
      discountType,
      discountValue,
      discountAmount: this.toMoney(0),
      subtotal: this.toMoney(params.subtotal),
      finalSubtotal: this.toMoney(params.subtotal),
      minimumOrderAmount,
      firstOrderOnly,
    };
  }

  /**
   * Formata decimal monetario para persistencia.
   */
  private toMoney(value: number) {
    return value.toFixed(2);
  }
}
