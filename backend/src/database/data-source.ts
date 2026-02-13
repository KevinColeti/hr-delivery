import { DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Client } from '../entities/client.entity';
import { Ingredient } from '../entities/ingredient.entity';
import { ProductIngredient } from '../entities/product-ingredient.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { getEnvValue } from './env';

const dataSource = new DataSource({
  type: 'postgres',
  host: getEnvValue('DB_HOST', 'localhost'),
  port: Number(getEnvValue('DB_PORT', '5432')),
  username: getEnvValue('DB_USER', 'postgres'),
  password: getEnvValue('DB_PASS', ''),
  database: getEnvValue('DB_NAME', 'postgres'),
  entities: [User, Client, Category, Ingredient, Product, ProductIngredient],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});

export default dataSource;
