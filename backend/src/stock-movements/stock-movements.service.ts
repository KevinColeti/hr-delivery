import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Ingredient } from '../entities/ingredient.entity';
import {
  StockMovement,
  StockMovementSource,
  StockMovementType,
} from '../entities/stock-movement.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';

interface RegisterOrderConfirmationExitParams {
  ingredientId: number;
  orderId: number;
  quantity: number;
  reason?: string;
}

@Injectable()
/**
 * Centraliza regras de movimentacao de estoque.
 *
 * Responsabilidades:
 * - registrar entradas/saidas/ajustes manuais;
 * - manter saldo do insumo sincronizado com a movimentacao gravada;
 * - registrar saidas automaticas de confirmacao de pedido.
 */
export class StockMovementsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
  ) {}

  /**
   * Lista historico de movimentacoes com filtros operacionais.
   */
  async findAll(query: ListStockMovementsQueryDto) {
    const qb = this.stockMovementsRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.ingredient', 'ingredient')
      .leftJoinAndSelect('movement.order', 'order')
      .orderBy('movement.createdAt', 'DESC')
      .take(query.limit ?? 100);

    if (query.ingredientId) {
      qb.andWhere('movement.ingredientId = :ingredientId', {
        ingredientId: query.ingredientId,
      });
    }

    if (query.type) {
      qb.andWhere('movement.type = :type', { type: query.type });
    }

    if (query.source) {
      qb.andWhere('movement.source = :source', { source: query.source });
    }

    if (query.orderId) {
      qb.andWhere('movement.orderId = :orderId', { orderId: query.orderId });
    }

    return qb.getMany();
  }

  /**
   * Cria movimentacao manual em transacao para manter consistencia.
   */
  async createManual(dto: CreateStockMovementDto) {
    return this.dataSource.transaction((manager) =>
      this.applyMovementWithManager(manager, {
        ingredientId: dto.ingredientId,
        type: dto.type,
        source: StockMovementSource.MANUAL,
        quantity: dto.quantity,
        targetQuantity: dto.targetQuantity,
        reason: dto.reason,
        notes: dto.notes,
        orderId: null,
      }),
    );
  }

  /**
   * Registra baixa automatica de estoque vinculada a confirmacao de pedido.
   *
   * Este metodo nao abre transacao propria porque ele deve participar
   * da mesma transacao do fluxo de confirmacao do pedido.
   */
  async registerOrderConfirmationExitWithManager(
    manager: EntityManager,
    params: RegisterOrderConfirmationExitParams,
  ) {
    return this.applyMovementWithManager(manager, {
      ingredientId: params.ingredientId,
      type: StockMovementType.EXIT,
      source: StockMovementSource.ORDER_CONFIRMATION,
      quantity: params.quantity,
      reason:
        params.reason ??
        `Baixa automatica de estoque na confirmacao do pedido #${params.orderId}`,
      notes: null,
      orderId: params.orderId,
    });
  }

  /**
   * Aplica regra de movimentacao alterando saldo e gravando historico.
   *
   * Motivo de centralizar aqui:
   * evita divergencia entre saldo atual e historico quando multiplos fluxos
   * (manual e pedido confirmado) mexem no mesmo insumo.
   */
  private async applyMovementWithManager(
    manager: EntityManager,
    params: {
      ingredientId: number;
      type: StockMovementType;
      source: StockMovementSource;
      quantity?: number;
      targetQuantity?: number;
      reason: string;
      notes?: string | null;
      orderId: number | null;
    },
  ) {
    const ingredient = await manager.findOne(Ingredient, {
      where: { id: params.ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundException('Insumo nao encontrado para movimentacao');
    }

    const previousStock = Number(ingredient.stockQuantity);
    const quantityChange = this.resolveQuantityChange(params, previousStock);
    const nextStock = previousStock + quantityChange;

    if (nextStock < 0) {
      throw new BadRequestException(
        `Estoque insuficiente para insumo ${ingredient.name}. Atual: ${previousStock.toFixed(3)}, solicitado: ${Math.abs(quantityChange).toFixed(3)}`,
      );
    }

    ingredient.stockQuantity = this.toDbNumeric(nextStock);
    await manager.save(Ingredient, ingredient);

    const movement = manager.create(StockMovement, {
      ingredientId: ingredient.id,
      orderId: params.orderId,
      type: params.type,
      source: params.source,
      quantityChange: this.toDbNumeric(quantityChange),
      stockBefore: this.toDbNumeric(previousStock),
      stockAfter: this.toDbNumeric(nextStock),
      reason: params.reason.trim(),
      notes: params.notes?.trim() || null,
    });

    return manager.save(StockMovement, movement);
  }

  /**
   * Converte payload de entrada/saida/ajuste em delta decimal assinado.
   */
  private resolveQuantityChange(
    params: {
      type: StockMovementType;
      quantity?: number;
      targetQuantity?: number;
    },
    previousStock: number,
  ) {
    if (params.type === StockMovementType.ADJUSTMENT) {
      if (params.targetQuantity === undefined) {
        throw new BadRequestException(
          'targetQuantity e obrigatorio para movimentacao do tipo adjustment',
        );
      }

      const targetQuantity = this.toDecimalScale(params.targetQuantity);
      const quantityChange = this.toDecimalScale(targetQuantity - previousStock);

      if (quantityChange === 0) {
        throw new BadRequestException(
          'Movimentacao adjustment sem alteracao de saldo nao e permitida',
        );
      }

      return quantityChange;
    }

    if (params.quantity === undefined) {
      throw new BadRequestException(
        'quantity e obrigatorio para movimentacao dos tipos entry e exit',
      );
    }

    const quantity = this.toDecimalScale(params.quantity);
    if (quantity <= 0) {
      throw new BadRequestException('quantity deve ser maior que zero');
    }

    return params.type === StockMovementType.ENTRY ? quantity : -quantity;
  }

  /**
   * Padroniza valor decimal para 3 casas com arredondamento.
   */
  private toDecimalScale(value: number) {
    return Number(value.toFixed(3));
  }

  /**
   * Formata decimal para persistencia nas colunas numeric(12,3).
   */
  private toDbNumeric(value: number) {
    return this.toDecimalScale(value).toFixed(3);
  }
}
