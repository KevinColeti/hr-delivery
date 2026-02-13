import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ProductIngredient } from './product-ingredient.entity';

@Entity({ name: 'ingredients' })
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 120 })
  name: string;

  @Column({ length: 12 })
  unit: string;

  @Column({ name: 'stock_quantity', type: 'numeric', precision: 12, scale: 3, default: 0 })
  stockQuantity: string;

  @Column({ name: 'minimum_quantity', type: 'numeric', precision: 12, scale: 3, default: 0 })
  minimumQuantity: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ProductIngredient, (productIngredient) => productIngredient.ingredient)
  productIngredients: ProductIngredient[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
