import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { Client } from '../entities/client.entity';
import { Ingredient } from '../entities/ingredient.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { ProductExtra } from '../entities/product-extra.entity';
import { ProductIngredient } from '../entities/product-ingredient.entity';
import { Product } from '../entities/product.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { User } from '../entities/user.entity';
import { getEnvValue } from './env';

export const entities = [
  User,
  Client,
  Category,
  Ingredient,
  Product,
  ProductIngredient,
  ProductExtra,
  StockMovement,
  Order,
  OrderItem,
  OrderStatusHistory,
];

export function getDatabaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: getEnvValue('DB_HOST', 'localhost'),
    port: Number(getEnvValue('DB_PORT', '5432')),
    username: getEnvValue('DB_USER', 'postgres'),
    password: getEnvValue('DB_PASS', ''),
    database: getEnvValue('DB_NAME', 'postgres'),
    entities,
    synchronize: false,
  };
}
