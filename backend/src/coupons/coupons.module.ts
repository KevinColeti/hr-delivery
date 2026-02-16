import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../entities/client.entity';
import { Coupon } from '../entities/coupon.entity';
import { Order } from '../entities/order.entity';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, Client, Order])],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
/**
 * Modulo de cupons.
 */
export class CouponsModule {}
