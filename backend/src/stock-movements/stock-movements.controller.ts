import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';
import { StockMovementsService } from './stock-movements.service';

@Controller('stock-movements')
/**
 * Endpoints de historico e ajustes de estoque.
 */
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  /**
   * Lista movimentacoes de estoque com filtros opcionais.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findAll(@Query() query: ListStockMovementsQueryDto) {
    return this.stockMovementsService.findAll(query);
  }

  /**
   * Cria movimentacao manual de entrada, saida ou ajuste.
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateStockMovementDto) {
    return this.stockMovementsService.createManual(dto);
  }
}
