import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../entities/client.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { ListClientOrdersQueryDto } from './dto/list-client-orders-query.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';

interface ClientSummaryRawRow {
  client_id: number | string;
  client_name: string;
  client_phone: string;
  client_address_line: string | null;
  client_neighborhood: string | null;
  client_city: string | null;
  client_state: string | null;
  client_zip_code: string | null;
  client_created_at: Date | string;
  client_updated_at: Date | string;
  orders_count: number | string;
  non_canceled_orders_count: number | string;
  canceled_orders_count: number | string;
  total_spent: number | string | null;
  last_order_at: Date | string | null;
}

export interface ClientConsolidatedSummary {
  id: number;
  name: string;
  phone: string;
  addressLine: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  ordersCount: number;
  nonCanceledOrdersCount: number;
  canceledOrdersCount: number;
  totalSpent: string;
  lastOrderAt: Date | null;
}

@Injectable()
/**
 * Servico de consulta de clientes para backoffice.
 *
 * Responsabilidades:
 * - listar clientes com metricas consolidadas de pedidos;
 * - retornar detalhe consolidado por cliente;
 * - retornar historico de pedidos de um cliente.
 */
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  /**
   * Lista clientes com dados consolidados de pedidos.
   */
  async findAll(query: ListClientsQueryDto) {
    const qb = this.buildClientSummaryQuery();

    const trimmedSearch = query.search?.trim();
    if (trimmedSearch) {
      const normalizedPhoneSearch = trimmedSearch.replace(/\D/g, '');
      if (normalizedPhoneSearch.length > 0) {
        qb.andWhere('(LOWER(client.name) LIKE LOWER(:nameSearch) OR client.phone LIKE :phoneSearch)', {
          nameSearch: `%${trimmedSearch}%`,
          phoneSearch: `%${normalizedPhoneSearch}%`,
        });
      } else {
        qb.andWhere('LOWER(client.name) LIKE LOWER(:nameSearch)', {
          nameSearch: `%${trimmedSearch}%`,
        });
      }
    }

    if (query.onlyWithOrders) {
      qb.having('COUNT("order".id) > 0');
    }

    qb.orderBy('last_order_at', 'DESC', 'NULLS LAST')
      .addOrderBy('client_created_at', 'DESC')
      .take(query.limit ?? 50);

    const rows = await qb.getRawMany<ClientSummaryRawRow>();
    return rows.map((row) => this.mapClientSummaryRawRow(row));
  }

  /**
   * Retorna cliente com metricas consolidadas.
   */
  async findOne(clientId: number) {
    const row = await this.buildClientSummaryQuery()
      .where('client.id = :clientId', { clientId })
      .getRawOne<ClientSummaryRawRow>();

    if (!row) {
      throw new NotFoundException('Cliente nao encontrado');
    }

    return this.mapClientSummaryRawRow(row);
  }

  /**
   * Retorna historico operacional de pedidos de um cliente.
   */
  async findOrderHistory(clientId: number, query: ListClientOrdersQueryDto) {
    const client = await this.findOne(clientId);
    const orders = await this.ordersRepository.find({
      where: { clientId },
      relations: { items: { extras: true }, appliedCoupon: true, appliedCombo: true },
      order: { createdAt: 'DESC' },
      take: query.limit ?? 100,
    });

    return {
      client,
      orders,
    };
  }

  /**
   * Monta query agregada para evitar N+1 ao consolidar metricas por cliente.
   *
   * Motivo:
   * usamos uma unica agregacao para listar muitos clientes com seus totais,
   * sem disparar consultas individuais de contagem/soma por linha.
   */
  private buildClientSummaryQuery() {
    return this.clientsRepository
      .createQueryBuilder('client')
      .leftJoin(Order, 'order', 'order.client_id = client.id')
      .select('client.id', 'client_id')
      .addSelect('client.name', 'client_name')
      .addSelect('client.phone', 'client_phone')
      .addSelect('client.address_line', 'client_address_line')
      .addSelect('client.neighborhood', 'client_neighborhood')
      .addSelect('client.city', 'client_city')
      .addSelect('client.state', 'client_state')
      .addSelect('client.zip_code', 'client_zip_code')
      .addSelect('client.created_at', 'client_created_at')
      .addSelect('client.updated_at', 'client_updated_at')
      .addSelect('COUNT("order".id)', 'orders_count')
      .addSelect(
        `COALESCE(SUM(CASE WHEN "order".status <> :canceledStatus THEN 1 ELSE 0 END), 0)`,
        'non_canceled_orders_count',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN "order".status = :canceledStatus THEN 1 ELSE 0 END), 0)`,
        'canceled_orders_count',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN "order".status <> :canceledStatus THEN CAST("order".total AS numeric) ELSE 0 END), 0)`,
        'total_spent',
      )
      .addSelect('MAX("order".created_at)', 'last_order_at')
      .setParameter('canceledStatus', OrderStatus.CANCELED)
      .groupBy('client.id')
      .addGroupBy('client.name')
      .addGroupBy('client.phone')
      .addGroupBy('client.address_line')
      .addGroupBy('client.neighborhood')
      .addGroupBy('client.city')
      .addGroupBy('client.state')
      .addGroupBy('client.zip_code')
      .addGroupBy('client.created_at')
      .addGroupBy('client.updated_at');
  }

  /**
   * Converte linha crua de agregacao para contrato de resposta da API.
   */
  private mapClientSummaryRawRow(row: ClientSummaryRawRow): ClientConsolidatedSummary {
    return {
      id: this.toInteger(row.client_id),
      name: row.client_name,
      phone: row.client_phone,
      addressLine: row.client_address_line,
      neighborhood: row.client_neighborhood,
      city: row.client_city,
      state: row.client_state,
      zipCode: row.client_zip_code,
      createdAt: new Date(row.client_created_at),
      updatedAt: new Date(row.client_updated_at),
      ordersCount: this.toInteger(row.orders_count),
      nonCanceledOrdersCount: this.toInteger(row.non_canceled_orders_count),
      canceledOrdersCount: this.toInteger(row.canceled_orders_count),
      totalSpent: this.toMoney(row.total_spent),
      lastOrderAt: row.last_order_at ? new Date(row.last_order_at) : null,
    };
  }

  /**
   * Converte valor agregado para inteiro seguro.
   */
  private toInteger(value: string | number) {
    return Number.parseInt(String(value), 10);
  }

  /**
   * Normaliza decimal para string monetaria com 2 casas.
   */
  private toMoney(value: string | number | null) {
    return Number(value ?? 0).toFixed(2);
  }
}
