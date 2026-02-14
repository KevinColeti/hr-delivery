import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { ProductIngredient } from '../entities/product-ingredient.entity';
import { Product } from '../entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, ProductIngredient])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
/**
 * Modulo de produtos.
 */
export class ProductsModule {}
