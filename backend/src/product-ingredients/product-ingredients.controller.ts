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
import { CreateProductIngredientDto } from './dto/create-product-ingredient.dto';
import { UpdateProductIngredientDto } from './dto/update-product-ingredient.dto';
import { ProductIngredientsService } from './product-ingredients.service';

@Controller('products/:productId/ingredients')
/**
 * Endpoints da receita base de produto.
 */
export class ProductIngredientsController {
  constructor(private readonly productIngredientsService: ProductIngredientsService) {}

  /**
   * Lista receita do produto.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findAllByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.productIngredientsService.findAllByProduct(productId);
  }

  /**
   * Busca item especifico de receita.
   */
  @Get(':recipeItemId')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findOne(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('recipeItemId', ParseIntPipe) recipeItemId: number,
  ) {
    return this.productIngredientsService.findOne(productId, recipeItemId);
  }

  /**
   * Cria item de receita (admin).
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateProductIngredientDto,
  ) {
    return this.productIngredientsService.create(productId, dto);
  }

  /**
   * Atualiza item de receita (admin).
   */
  @Patch(':recipeItemId')
  @Roles(UserRole.ADMIN)
  update(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('recipeItemId', ParseIntPipe) recipeItemId: number,
    @Body() dto: UpdateProductIngredientDto,
  ) {
    return this.productIngredientsService.update(productId, recipeItemId, dto);
  }

  /**
   * Remove item de receita (admin).
   */
  @Delete(':recipeItemId')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('recipeItemId', ParseIntPipe) recipeItemId: number,
  ) {
    return this.productIngredientsService.remove(productId, recipeItemId);
  }
}
