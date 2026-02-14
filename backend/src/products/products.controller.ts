import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
/**
 * Endpoints de produtos.
 */
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Lista produtos com disponibilidade.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findAll() {
    return this.productsService.findAll();
  }

  /**
   * Lista produtos publicos para vitrine do site.
   */
  @Get('public/catalog')
  @Public()
  findPublicCatalog() {
    return this.productsService.findPublicCatalog();
  }

  /**
   * Busca produto por id com disponibilidade.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  /**
   * Retorna somente disponibilidade do produto.
   */
  @Get(':id/availability')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  availability(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getAvailability(id);
  }

  /**
   * Cria produto (admin).
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  /**
   * Atualiza produto (admin).
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  /**
   * Remove produto (admin).
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
