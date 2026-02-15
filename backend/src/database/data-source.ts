import { DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Client } from '../entities/client.entity';
import { ComboRule } from '../entities/combo-rule.entity';
import { Combo } from '../entities/combo.entity';
import { Coupon } from '../entities/coupon.entity';
import { Ingredient } from '../entities/ingredient.entity';
import { OrderItemExtra } from '../entities/order-item-extra.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { ProductExtra } from '../entities/product-extra.entity';
import { ProductIngredient } from '../entities/product-ingredient.entity';
import { Product } from '../entities/product.entity';
import { StoreSettings } from '../entities/store-settings.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { User } from '../entities/user.entity';
import { WhatsAppNotificationLog } from '../entities/whatsapp-notification-log.entity';
import { getEnvValue } from './env';

const dataSource = new DataSource({
  type: 'postgres',
  host: getEnvValue('DB_HOST', 'localhost'),
  port: Number(getEnvValue('DB_PORT', '5432')),
  username: getEnvValue('DB_USER', 'postgres'),
  password: getEnvValue('DB_PASS', ''),
  database: getEnvValue('DB_NAME', 'postgres'),
  entities: [
    User,
    Client,
    Combo,
    ComboRule,
    Coupon,
    Category,
    Ingredient,
    Product,
    ProductIngredient,
    ProductExtra,
    StoreSettings,
    StockMovement,
    Order,
    OrderItem,
    OrderItemExtra,
    OrderStatusHistory,
    WhatsAppNotificationLog,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});

export default dataSource;
