import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from '../entities/ingredient.entity';
import { ProductExtra } from '../entities/product-extra.entity';
import { Product } from '../entities/product.entity';
import { ProductExtrasController } from './product-extras.controller';
import { ProductExtrasService } from './product-extras.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductExtra, Product, Ingredient])],
  controllers: [ProductExtrasController],
  providers: [ProductExtrasService],
  exports: [ProductExtrasService],
})
/**
 * Modulo de extras dos produtos.
 */
export class ProductExtrasModule {}
