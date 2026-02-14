import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CreateProductExtraDto } from './dto/create-product-extra.dto';
import { UpdateProductExtraDto } from './dto/update-product-extra.dto';
import { ProductExtrasService } from './product-extras.service';

@Controller('products/:productId/extras')
/**
 * Endpoints de extras por produto.
 */
export class ProductExtrasController {
  constructor(private readonly productExtrasService: ProductExtrasService) {}

  /**
   * Lista extras do produto.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findAll(@Param('productId', ParseIntPipe) productId: number) {
    return this.productExtrasService.findAllByProduct(productId);
  }

  /**
   * Busca extra por id.
   */
  @Get(':extraId')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findOne(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('extraId', ParseIntPipe) extraId: number,
  ) {
    return this.productExtrasService.findOne(productId, extraId);
  }

  /**
   * Cria extra (admin).
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateProductExtraDto,
  ) {
    return this.productExtrasService.create(productId, dto);
  }

  /**
   * Atualiza extra (admin).
   */
  @Patch(':extraId')
  @Roles(UserRole.ADMIN)
  update(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('extraId', ParseIntPipe) extraId: number,
    @Body() dto: UpdateProductExtraDto,
  ) {
    return this.productExtrasService.update(productId, extraId, dto);
  }

  /**
   * Remove extra (admin).
   */
  @Delete(':extraId')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('extraId', ParseIntPipe) extraId: number,
  ) {
    return this.productExtrasService.remove(productId, extraId);
  }
}
