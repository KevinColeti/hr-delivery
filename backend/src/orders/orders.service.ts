import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';
import { Client } from '../entities/client.entity';
import { ComboRuleType } from '../entities/combo-rule.entity';
import { Combo, ComboDiscountType } from '../entities/combo.entity';
import { Coupon, CouponDiscountType } from '../entities/coupon.entity';
import { Ingredient } from '../entities/ingredient.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { ProductIngredient } from '../entities/product-ingredient.entity';
import { Product } from '../entities/product.entity';
import { UserRole } from '../entities/user.entity';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListKitchenBoardQueryDto } from './dto/list-kitchen-board-query.dto';
import { OrdersRealtimeService } from './orders-realtime.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

interface OrderStatusChangeActor {
  id: number | null;
  name: string | null;
  email: string | null;
  role: UserRole | null;
}

interface DiscountResolutionResult {
  discountAmount: number;
  appliedCouponId: number | null;
  appliedCouponCode: string | null;
  appliedComboId: number | null;
  appliedComboName: string | null;
}

export interface TrackingStep {
  status: OrderStatus;
  label: string;
  done: boolean;
}

export interface PublicOrderTrackingResponse {
  id: number;
  status: OrderStatus;
  total: string;
  createdAt: Date;
  updatedAt: Date;
  timeline: TrackingStep[];
}

@Injectable()
/**
 * Orquestra o ciclo de vida dos pedidos.
 *
 * Responsabilidades:
 * - criar pedido com snapshot de itens/precos;
 * - validar transicoes de status;
 * - confirmar pedido com baixa atomica de estoque por receita.
 */
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Combo)
    private readonly combosRepository: Repository<Combo>,
    @InjectRepository(ProductIngredient)
    private readonly productIngredientsRepository: Repository<ProductIngredient>,
    @InjectRepository(OrderStatusHistory)
    private readonly orderStatusHistoryRepository: Repository<OrderStatusHistory>,
    private readonly stockMovementsService: StockMovementsService,
    private readonly ordersRealtimeService: OrdersRealtimeService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  /**
   * Lista pedidos para visao operacional, ordenando do mais recente para o mais antigo.
   */
  findAll() {
    return this.ordersRepository.find({
      relations: { items: true, client: true, appliedCoupon: true, appliedCombo: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lista pedidos para o monitor da cozinha.
   *
   * Regra operacional:
   * - sempre inclui pedidos `confirmed` e `in_preparation`;
   * - inclui `ready` apenas quando solicitado por query.
   */
  findKitchenBoard(query: ListKitchenBoardQueryDto) {
    const statuses = [OrderStatus.CONFIRMED, OrderStatus.IN_PREPARATION];
    if (query.includeReady) {
      statuses.push(OrderStatus.READY);
    }

    return this.ordersRepository.find({
      where: { status: In(statuses) },
      relations: { items: true, client: true, appliedCoupon: true, appliedCombo: true },
      order: { createdAt: 'ASC' },
      take: query.limit ?? 100,
    });
  }

  /**
   * Retorna um pedido completo (cliente + itens) por id.
   */
  async findOne(id: number) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { items: true, client: true, appliedCoupon: true, appliedCombo: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado');
    }

    return order;
  }

  /**
   * Lista historico de status de um pedido em ordem cronologica.
   */
  async findStatusHistory(orderId: number) {
    await this.findOne(orderId);

    return this.orderStatusHistoryRepository.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
      relations: { changedByUser: true },
    });
  }

  /**
   * Retorna visao publica de acompanhamento do pedido.
   */
  async findPublicTracking(orderId: number): Promise<PublicOrderTrackingResponse> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado');
    }

    return {
      id: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      timeline: this.buildTrackingTimeline(order.status),
    };
  }

  /**
   * Cria um pedido novo com itens e totais calculados no backend.
   *
   * O backend calcula subtotal/total para centralizar regra de preco
   * e evitar divergencia entre clientes.
   */
  async create(dto: CreateOrderDto) {
    if (dto.couponCode && dto.discountAmount !== undefined) {
      throw new BadRequestException(
        'Nao e permitido informar discountAmount manual quando couponCode e usado',
      );
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      await this.ensureClientExists(dto.clientId, manager, true);

      const orderItemsData: OrderItem[] = [];
      let subtotal = 0;
      const productQuantityMap = new Map<number, number>();
      const categoryQuantityMap = new Map<number, number>();

      for (const item of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
        });

        if (!product) {
          throw new BadRequestException(
            `Produto ${item.productId} nao encontrado`,
          );
        }

        if (!product.isActive) {
          throw new BadRequestException(`Produto ${product.name} esta inativo`);
        }

        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        orderItemsData.push(
          manager.create(OrderItem, {
            productId: product.id,
            productName: product.name,
            quantity: item.quantity,
            unitPrice: this.toMoney(unitPrice),
            lineTotal: this.toMoney(lineTotal),
          }),
        );

        productQuantityMap.set(
          product.id,
          (productQuantityMap.get(product.id) ?? 0) + item.quantity,
        );
        categoryQuantityMap.set(
          product.categoryId,
          (categoryQuantityMap.get(product.categoryId) ?? 0) + item.quantity,
        );
      }

      const deliveryFee = dto.deliveryFee ?? 0;
      const discount = await this.resolveDiscountStrategy(
        manager,
        dto,
        subtotal,
        productQuantityMap,
        categoryQuantityMap,
      );
      const total = this.calculateOrderTotal(subtotal, deliveryFee, discount.discountAmount);

      const order = manager.create(Order, {
        clientId: dto.clientId,
        status: OrderStatus.NEW,
        subtotal: this.toMoney(subtotal),
        deliveryFee: this.toMoney(deliveryFee),
        discountAmount: this.toMoney(discount.discountAmount),
        total: this.toMoney(total),
        notes: dto.notes?.trim() || null,
        appliedCouponId: discount.appliedCouponId,
        appliedCouponCode: discount.appliedCouponCode,
        appliedComboId: discount.appliedComboId,
        appliedComboName: discount.appliedComboName,
        items: orderItemsData,
      });

      return manager.save(Order, order);
    });

    const fullOrder = await this.findOne(saved.id);

    this.ordersRealtimeService.publish({
      type: 'order_created',
      orderId: fullOrder.id,
      status: fullOrder.status,
    });
    await this.whatsAppService.sendOrderCreated(fullOrder);

    return fullOrder;
  }

  /**
   * Atualiza status de um pedido respeitando transicoes validas.
   *
   * Quando o status alvo e `confirmed`, a confirmacao roda em transacao
   * para garantir consistencia entre pedido e estoque.
   */
  async updateStatus(
    id: number,
    dto: UpdateOrderStatusDto,
    actor: OrderStatusChangeActor = {
      id: null,
      name: null,
      email: null,
      role: null,
    },
  ) {
    const order = await this.findOne(id);
    const previousStatus = order.status;

    if (previousStatus === dto.status) {
      return order;
    }

    this.validateActorTransitionPermission(previousStatus, dto.status, actor.role);
    this.validateStatusTransition(previousStatus, dto.status);

    if (dto.status === OrderStatus.CONFIRMED) {
      await this.confirmOrderAndDeductStock(id, actor);
      const confirmedOrder = await this.findOne(id);
      this.ordersRealtimeService.publish({
        type: 'order_status_changed',
        orderId: confirmedOrder.id,
        status: confirmedOrder.status,
        previousStatus,
      });
      await this.whatsAppService.sendOrderStatusUpdated(confirmedOrder);
      return confirmedOrder;
    }

    await this.dataSource.transaction(async (manager) => {
      const managedOrder = await manager.findOne(Order, { where: { id } });

      if (!managedOrder) {
        throw new NotFoundException('Pedido nao encontrado');
      }

      managedOrder.status = dto.status;
      await manager.save(Order, managedOrder);

      await this.recordStatusChangeWithManager(manager, {
        orderId: managedOrder.id,
        previousStatus,
        nextStatus: dto.status,
        actor,
      });
    });

    const updatedOrder = await this.findOne(id);
    this.ordersRealtimeService.publish({
      type: 'order_status_changed',
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      previousStatus,
    });
    await this.whatsAppService.sendOrderStatusUpdated(updatedOrder);

    return updatedOrder;
  }

  /**
   * Atalho operacional da cozinha para marcar pedido como pronto.
   */
  markReady(orderId: number, actor: OrderStatusChangeActor) {
    return this.updateStatus(orderId, { status: OrderStatus.READY }, actor);
  }

  /**
   * Restringe transicoes por papel operacional.
   *
   * Regra:
   * - `admin`: pode operar todas as transicoes validas;
   * - `kitchen`: atua somente em preparo/cozinha.
   */
  private validateActorTransitionPermission(
    current: OrderStatus,
    next: OrderStatus,
    actorRole: UserRole | null,
  ) {
    if (actorRole !== UserRole.KITCHEN) {
      return;
    }

    const kitchenAllowedTransitions = new Set<string>([
      `${OrderStatus.CONFIRMED}->${OrderStatus.IN_PREPARATION}`,
      `${OrderStatus.IN_PREPARATION}->${OrderStatus.READY}`,
    ]);

    const signature = `${current}->${next}`;
    if (!kitchenAllowedTransitions.has(signature)) {
      throw new BadRequestException(
        'Perfil cozinha so pode mover pedidos de confirmado para em_preparo e de em_preparo para pronto',
      );
    }
  }

  /**
   * Confirma pedido e baixa estoque de insumos de forma atomica.
   *
   * Motivo da transacao:
   * evitar cenarios onde parte do estoque e baixada e o pedido nao e confirmado
   * (ou vice-versa) em caso de erro no meio do processo.
   */
  private async confirmOrderAndDeductStock(
    orderId: number,
    actor: OrderStatusChangeActor,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: { items: true },
      });

      if (!order) {
        throw new NotFoundException('Pedido nao encontrado');
      }

      if (order.status !== OrderStatus.NEW) {
        throw new BadRequestException('Somente pedidos novos podem ser confirmados');
      }

      // Acumula consumo por insumo para validar e debitar uma unica vez.
      // Isso evita debitarmos o mesmo insumo varias vezes em loops separados.
      const requiredByIngredient = new Map<number, number>();

      for (const item of order.items) {
        const recipeItems = await manager.find(ProductIngredient, {
          where: { productId: item.productId },
        });

        if (recipeItems.length === 0) {
          throw new BadRequestException(
            `Produto ${item.productName} nao possui receita cadastrada`,
          );
        }

        for (const recipeItem of recipeItems) {
          const required = Number(recipeItem.quantity) * item.quantity;
          const current = requiredByIngredient.get(recipeItem.ingredientId) ?? 0;
          requiredByIngredient.set(recipeItem.ingredientId, current + required);
        }
      }

      // Valida saldo de todos os insumos antes de qualquer debito.
      // Fazemos isso para manter a operacao "all-or-nothing".
      for (const [ingredientId, required] of requiredByIngredient.entries()) {
        const ingredient = await manager.findOne(Ingredient, {
          where: { id: ingredientId },
        });

        if (!ingredient) {
          throw new BadRequestException(`Insumo ${ingredientId} nao encontrado`);
        }

        const currentStock = Number(ingredient.stockQuantity);
        if (currentStock < required) {
          throw new BadRequestException(
            `Estoque insuficiente para insumo ${ingredient.name}. Necessario: ${required.toFixed(3)}, atual: ${currentStock.toFixed(3)}`,
          );
        }
      }

      // Com saldo validado, aplica debitos e registra historico.
      // O registro acontece na mesma transacao para evitar saldo sem trilha.
      for (const [ingredientId, required] of requiredByIngredient.entries()) {
        await this.stockMovementsService.registerOrderConfirmationExitWithManager(
          manager,
          {
            ingredientId,
            orderId: order.id,
            quantity: required,
          },
        );
      }

      order.status = OrderStatus.CONFIRMED;
      await manager.save(Order, order);

      await this.recordStatusChangeWithManager(manager, {
        orderId: order.id,
        previousStatus: OrderStatus.NEW,
        nextStatus: OrderStatus.CONFIRMED,
        actor,
      });
    });
  }

  /**
   * Persiste auditoria de mudanca de status com snapshot do usuario.
   *
   * Snapshot de nome/email e mantido para preservar trilha mesmo que o usuario
   * seja alterado ou removido no futuro.
   */
  private async recordStatusChangeWithManager(
    manager: EntityManager,
    params: {
      orderId: number;
      previousStatus: OrderStatus;
      nextStatus: OrderStatus;
      actor: OrderStatusChangeActor;
    },
  ) {
    const audit = manager.create(OrderStatusHistory, {
      orderId: params.orderId,
      previousStatus: params.previousStatus,
      nextStatus: params.nextStatus,
      changedByUserId: params.actor.id,
      changedByName: params.actor.name,
      changedByEmail: params.actor.email,
    });

    await manager.save(OrderStatusHistory, audit);
  }

  /**
   * Define e valida o grafo de transicao de status.
   *
   * O objetivo e impedir "saltos" de fluxo que prejudiquem a operacao
   * (ex.: `new` -> `delivered`).
   */
  private validateStatusTransition(current: OrderStatus, next: OrderStatus) {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.NEW]: [OrderStatus.CONFIRMED, OrderStatus.CANCELED],
      [OrderStatus.CONFIRMED]: [OrderStatus.IN_PREPARATION, OrderStatus.CANCELED],
      [OrderStatus.IN_PREPARATION]: [OrderStatus.READY, OrderStatus.CANCELED],
      [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELED]: [],
    };

    const allowed = allowedTransitions[current];
    if (!allowed.includes(next)) {
      throw new BadRequestException(`Transicao de status invalida: ${current} -> ${next}`);
    }
  }

  /**
   * Garante que o cliente informado existe antes de criar o pedido.
   */
  private async ensureClientExists(
    clientId: number,
    manager?: EntityManager,
    lockForUpdate = false,
  ) {
    const client = manager
      ? await manager.findOne(Client, {
          where: { id: clientId },
          lock: lockForUpdate ? { mode: 'pessimistic_write' } : undefined,
        })
      : await this.clientsRepository.findOne({ where: { id: clientId } });
    if (!client) {
      throw new BadRequestException('Cliente informado nao existe');
    }
  }

  /**
   * Resolve cupom por codigo aplicando lock para controlar limite de uso.
   */
  private async resolveAndValidateCoupon(
    manager: EntityManager,
    couponCode: string,
    subtotal: number,
    clientId: number,
  ) {
    const normalizedCode = couponCode.trim().toUpperCase();

    const coupon = await manager.findOne(Coupon, {
      where: { code: normalizedCode },
      lock: { mode: 'pessimistic_write' },
    });

    if (!coupon) {
      throw new BadRequestException('Cupom informado nao existe');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Cupom informado esta inativo');
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new BadRequestException('Cupom ainda nao iniciou vigencia');
    }

    if (coupon.endsAt && now > coupon.endsAt) {
      throw new BadRequestException('Cupom expirado');
    }

    if (subtotal < Number(coupon.minimumOrderAmount)) {
      throw new BadRequestException(
        `Cupom exige pedido minimo de ${Number(coupon.minimumOrderAmount).toFixed(2)}`,
      );
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Cupom atingiu limite de uso');
    }

    if (coupon.firstOrderOnly) {
      const previousOrdersCount = await manager.count(Order, {
        where: {
          clientId,
          status: Not(OrderStatus.CANCELED),
        },
      });

      if (previousOrdersCount > 0) {
        throw new BadRequestException(
          'Cupom valido apenas para primeiro pedido do cliente',
        );
      }
    }

    return coupon;
  }

  /**
   * Resolve o melhor combo valido para o carrinho atual.
   *
   * Politica atual:
   * - aplica apenas um combo;
   * - escolhe o combo com maior desconto monetario.
   */
  private async resolveBestCombo(
    manager: EntityManager,
    subtotal: number,
    productQuantityMap: Map<number, number>,
    categoryQuantityMap: Map<number, number>,
  ) {
    const combos = await manager.find(Combo, {
      where: { isActive: true },
      relations: { rules: true },
    });

    let bestCombo: Combo | null = null;
    let bestDiscount = 0;

    const now = new Date();
    for (const combo of combos) {
      if (combo.startsAt && now < combo.startsAt) {
        continue;
      }
      if (combo.endsAt && now > combo.endsAt) {
        continue;
      }
      if (!combo.rules || combo.rules.length === 0) {
        continue;
      }

      const isMatched = combo.rules.every((rule) => {
        if (rule.type === ComboRuleType.PRODUCT) {
          const currentQuantity = productQuantityMap.get(rule.productId ?? -1) ?? 0;
          return currentQuantity >= rule.minimumQuantity;
        }

        const currentQuantity = categoryQuantityMap.get(rule.categoryId ?? -1) ?? 0;
        return currentQuantity >= rule.minimumQuantity;
      });

      if (!isMatched) {
        continue;
      }

      const discount = this.calculateComboDiscount(combo, subtotal);
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestCombo = combo;
      }
    }

    return bestCombo;
  }

  /**
   * Calcula desconto de combo respeitando teto do subtotal.
   */
  private calculateComboDiscount(combo: Combo, subtotal: number) {
    const discountValue = Number(combo.discountValue);
    const rawDiscount =
      combo.discountType === ComboDiscountType.PERCENTAGE
        ? (subtotal * discountValue) / 100
        : discountValue;

    return Number(Math.min(rawDiscount, subtotal).toFixed(2));
  }

  /**
   * Resolve politica de desconto sem acumulo.
   *
   * Prioridade:
   * 1) desconto manual (quando informado);
   * 2) cupom (quando informado);
   * 3) combo automatico (quando nao ha desconto manual/cupom).
   */
  private async resolveDiscountStrategy(
    manager: EntityManager,
    dto: CreateOrderDto,
    subtotal: number,
    productQuantityMap: Map<number, number>,
    categoryQuantityMap: Map<number, number>,
  ): Promise<DiscountResolutionResult> {
    if (dto.discountAmount !== undefined) {
      if (dto.discountAmount > subtotal) {
        throw new BadRequestException(
          'discountAmount manual nao pode ser maior que o subtotal',
        );
      }

      return {
        discountAmount: dto.discountAmount,
        appliedCouponId: null,
        appliedCouponCode: null,
        appliedComboId: null,
        appliedComboName: null,
      };
    }

    if (dto.couponCode) {
      const coupon = await this.resolveAndValidateCoupon(
        manager,
        dto.couponCode,
        subtotal,
        dto.clientId,
      );
      const discountAmount = this.calculateCouponDiscount(coupon, subtotal);
      coupon.usageCount += 1;
      await manager.save(Coupon, coupon);

      return {
        discountAmount,
        appliedCouponId: coupon.id,
        appliedCouponCode: coupon.code,
        appliedComboId: null,
        appliedComboName: null,
      };
    }

    const combo = await this.resolveBestCombo(
      manager,
      subtotal,
      productQuantityMap,
      categoryQuantityMap,
    );
    if (!combo) {
      return {
        discountAmount: 0,
        appliedCouponId: null,
        appliedCouponCode: null,
        appliedComboId: null,
        appliedComboName: null,
      };
    }

    return {
      discountAmount: this.calculateComboDiscount(combo, subtotal),
      appliedCouponId: null,
      appliedCouponCode: null,
      appliedComboId: combo.id,
      appliedComboName: combo.name,
    };
  }

  /**
   * Calcula total final do pedido.
   */
  private calculateOrderTotal(
    subtotal: number,
    deliveryFee: number,
    discountAmount: number,
  ) {
    const total = subtotal + deliveryFee - discountAmount;
    if (total < 0) {
      throw new BadRequestException('Total do pedido nao pode ser negativo');
    }
    return total;
  }

  /**
   * Calcula desconto de cupom respeitando teto do subtotal.
   */
  private calculateCouponDiscount(coupon: Coupon, subtotal: number) {
    const discountValue = Number(coupon.discountValue);
    const rawDiscount =
      coupon.discountType === CouponDiscountType.PERCENTAGE
        ? (subtotal * discountValue) / 100
        : discountValue;

    return Number(Math.min(rawDiscount, subtotal).toFixed(2));
  }

  /**
   * Formata valores monetarios para persistencia padronizada.
   */
  private toMoney(value: number): string {
    return value.toFixed(2);
  }

  /**
   * Monta timeline de acompanhamento a partir do status atual.
   */
  private buildTrackingTimeline(currentStatus: OrderStatus): TrackingStep[] {
    const flow: Array<{ status: OrderStatus; label: string }> = [
      { status: OrderStatus.NEW, label: 'Pedido recebido' },
      { status: OrderStatus.CONFIRMED, label: 'Pedido confirmado' },
      { status: OrderStatus.IN_PREPARATION, label: 'Em preparo na cozinha' },
      { status: OrderStatus.READY, label: 'Pedido pronto' },
      { status: OrderStatus.OUT_FOR_DELIVERY, label: 'Saiu para entrega' },
      { status: OrderStatus.DELIVERED, label: 'Entregue' },
    ];

    if (currentStatus === OrderStatus.CANCELED) {
      return [
        { status: OrderStatus.NEW, label: 'Pedido recebido', done: true },
        { status: OrderStatus.CANCELED, label: 'Pedido cancelado', done: true },
      ];
    }

    const currentIndex = flow.findIndex((step) => step.status === currentStatus);
    return flow.map((step, index) => ({
      ...step,
      done: currentIndex >= 0 ? index <= currentIndex : false,
    }));
  }
}
