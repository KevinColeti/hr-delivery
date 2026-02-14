import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from '../entities/ingredient.entity';
import { ProductIngredient } from '../entities/product-ingredient.entity';
import { Product } from '../entities/product.entity';
import { ProductIngredientsController } from './product-ingredients.controller';
import { ProductIngredientsService } from './product-ingredients.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductIngredient, Product, Ingredient])],
  controllers: [ProductIngredientsController],
  providers: [ProductIngredientsService],
  exports: [ProductIngredientsService],
})
/**
 * Modulo de receita base dos produtos.
 */
export class ProductIngredientsModule {}
