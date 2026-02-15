import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Sse,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePublicCheckoutOrderDto } from './dto/create-public-checkout-order.dto';
import { ListKitchenBoardQueryDto } from './dto/list-kitchen-board-query.dto';
import { OrdersRealtimeService } from './orders-realtime.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService, PublicOrderTrackingResponse } from './orders.service';

@Controller('orders')
/**
 * Endpoints de pedidos operacionais.
 */
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ordersRealtimeService: OrdersRealtimeService,
  ) {}

  /**
   * Extrai usuario autenticado do request para auditoria operacional.
   */
  private getAuthenticatedUser(req: Request) {
    const request = req as Request & {
      user?: { id?: number; name?: string; email?: string; role?: UserRole };
    };

    return {
      id: request.user?.id ?? null,
      name: request.user?.name ?? null,
      email: request.user?.email ?? null,
      role: request.user?.role ?? null,
    };
  }

  /**
   * Lista pedidos.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findAll() {
    return this.ordersService.findAll();
  }

  /**
   * Stream SSE geral de eventos de pedidos.
   */
  @Sse('stream')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  stream(): Observable<MessageEvent> {
    return this.ordersRealtimeService.getOrdersStream();
  }

  /**
   * Lista pedidos para modo monitor da cozinha.
   */
  @Get('kitchen/board')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findKitchenBoard(@Query() query: ListKitchenBoardQueryDto) {
    return this.ordersService.findKitchenBoard(query);
  }

  /**
   * Stream SSE focado em eventos relevantes para cozinha.
   */
  @Sse('kitchen/stream')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  kitchenStream(): Observable<MessageEvent> {
    return this.ordersRealtimeService.getKitchenStream();
  }

  /**
   * Checkout publico com resolucao automatica de cliente por telefone.
   *
   * Motivo:
   * o site cliente nao deve depender de `clientId` tecnico.
   */
  @Post('checkout')
  @Public()
  createPublicCheckout(@Body() dto: CreatePublicCheckoutOrderDto) {
    return this.ordersService.createPublicCheckout(dto);
  }

  /**
   * Busca pedido por id.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  /**
   * Retorna acompanhamento publico de pedido por id.
   */
  @Get(':id/tracking')
  @Public()
  findTracking(@Param('id', ParseIntPipe) id: number): Promise<PublicOrderTrackingResponse> {
    return this.ordersService.findPublicTracking(id);
  }

  /**
   * Retorna historico de mudancas de status de um pedido.
   */
  @Get(':id/status-history')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findStatusHistory(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findStatusHistory(id);
  }

  /**
   * Cria pedido (site cliente/publico no estado atual).
   */
  @Post()
  @Public()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  /**
   * Atualiza status de pedido.
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: Request,
  ) {
    return this.ordersService.updateStatus(id, dto, this.getAuthenticatedUser(req));
  }

  /**
   * Acao operacional da cozinha para marcar pedido como pronto.
   */
  @Patch(':id/kitchen/ready')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  markReady(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.ordersService.markReady(id, this.getAuthenticatedUser(req));
  }
}
