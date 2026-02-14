import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../entities/client.entity';
import { ComboRule } from '../entities/combo-rule.entity';
import { Combo } from '../entities/combo.entity';
import { Coupon } from '../entities/coupon.entity';
import { Ingredient } from '../entities/ingredient.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { ProductIngredient } from '../entities/product-ingredient.entity';
import { Product } from '../entities/product.entity';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { OrdersController } from './orders.controller';
import { OrdersRealtimeService } from './orders-realtime.service';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      Client,
      Combo,
      ComboRule,
      Coupon,
      ProductIngredient,
      Ingredient,
      OrderStatusHistory,
    ]),
    StockMovementsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRealtimeService],
  exports: [OrdersService, OrdersRealtimeService],
})
/**
 * Modulo de pedidos.
 */
export class OrdersModule {}
