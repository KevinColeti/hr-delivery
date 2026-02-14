import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Client } from '../entities/client.entity';
import { Ingredient } from '../entities/ingredient.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { ProductIngredient } from '../entities/product-ingredient.entity';
import { Product } from '../entities/product.entity';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

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
    @InjectRepository(ProductIngredient)
    private readonly productIngredientsRepository: Repository<ProductIngredient>,
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  /**
   * Lista pedidos para visao operacional, ordenando do mais recente para o mais antigo.
   */
  findAll() {
    return this.ordersRepository.find({
      relations: { items: true, client: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retorna um pedido completo (cliente + itens) por id.
   */
  async findOne(id: number) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { items: true, client: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado');
    }

    return order;
  }

  /**
   * Cria um pedido novo com itens e totais calculados no backend.
   *
   * O backend calcula subtotal/total para centralizar regra de preco
   * e evitar divergencia entre clientes.
   */
  async create(dto: CreateOrderDto) {
    await this.ensureClientExists(dto.clientId);

    const orderItemsData: OrderItem[] = [];
    let subtotal = 0;

    for (const item of dto.items) {
      const product = await this.productsRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new BadRequestException(`Produto ${item.productId} nao encontrado`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Produto ${product.name} esta inativo`);
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      orderItemsData.push(
        this.orderItemsRepository.create({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: this.toMoney(unitPrice),
          lineTotal: this.toMoney(lineTotal),
        }),
      );
    }

    const deliveryFee = dto.deliveryFee ?? 0;
    const discountAmount = dto.discountAmount ?? 0;
    const total = subtotal + deliveryFee - discountAmount;

    if (total < 0) {
      throw new BadRequestException('Total do pedido nao pode ser negativo');
    }

    const order = this.ordersRepository.create({
      clientId: dto.clientId,
      status: OrderStatus.NEW,
      subtotal: this.toMoney(subtotal),
      deliveryFee: this.toMoney(deliveryFee),
      discountAmount: this.toMoney(discountAmount),
      total: this.toMoney(total),
      notes: dto.notes?.trim() || null,
      items: orderItemsData,
    });

    const saved = await this.ordersRepository.save(order);
    return this.findOne(saved.id);
  }

  /**
   * Atualiza status de um pedido respeitando transicoes validas.
   *
   * Quando o status alvo e `confirmed`, a confirmacao roda em transacao
   * para garantir consistencia entre pedido e estoque.
   */
  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);
    const previousStatus = order.status;

    if (previousStatus === dto.status) {
      return order;
    }

    this.validateStatusTransition(previousStatus, dto.status);

    if (dto.status === OrderStatus.CONFIRMED) {
      await this.confirmOrderAndDeductStock(id);
      return this.findOne(id);
    }

    order.status = dto.status;
    await this.ordersRepository.save(order);
    return this.findOne(id);
  }

  /**
   * Confirma pedido e baixa estoque de insumos de forma atomica.
   *
   * Motivo da transacao:
   * evitar cenarios onde parte do estoque e baixada e o pedido nao e confirmado
   * (ou vice-versa) em caso de erro no meio do processo.
   */
  private async confirmOrderAndDeductStock(orderId: number) {
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
    });
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
  private async ensureClientExists(clientId: number) {
    const client = await this.clientsRepository.findOne({ where: { id: clientId } });
    if (!client) {
      throw new BadRequestException('Cliente informado nao existe');
    }
  }

  /**
   * Formata valores monetarios para persistencia padronizada.
   */
  private toMoney(value: number): string {
    return value.toFixed(2);
  }
}
