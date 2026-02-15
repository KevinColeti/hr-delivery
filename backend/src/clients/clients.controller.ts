import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ListClientOrdersQueryDto } from './dto/list-client-orders-query.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { ClientsService } from './clients.service';

@Controller('clients')
/**
 * Endpoints administrativos de consulta de clientes.
 */
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * Lista clientes com estatisticas consolidadas de pedidos.
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: ListClientsQueryDto) {
    return this.clientsService.findAll(query);
  }

  /**
   * Retorna detalhe consolidado de um cliente.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  /**
   * Retorna historico de pedidos de um cliente.
   */
  @Get(':id/orders')
  @Roles(UserRole.ADMIN)
  findOrderHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListClientOrdersQueryDto,
  ) {
    return this.clientsService.findOrderHistory(id, query);
  }
}
