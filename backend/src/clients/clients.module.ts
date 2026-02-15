import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../entities/client.entity';
import { Order } from '../entities/order.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Order])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
/**
 * Modulo de consultas de clientes para backoffice.
 */
export class ClientsModule {}
