import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { Product } from './product.entity';

@Entity({ name: 'product_extras' })
export class ProductExtra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'ingredient_id', type: 'int', nullable: true })
  ingredientId: number | null;

  @Column({
    name: 'ingredient_quantity',
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  ingredientQuantity: string | null;

  @Column({ name: 'ingredient_unit', type: 'varchar', length: 12, nullable: true })
  ingredientUnit: string | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Ingredient, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient | null;
}
