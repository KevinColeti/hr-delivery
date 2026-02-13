import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { Product } from './product.entity';

@Entity({ name: 'product_ingredients' })
@Unique('UQ_product_ingredient', ['productId', 'ingredientId'])
export class ProductIngredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ name: 'ingredient_id' })
  ingredientId: number;

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  quantity: string;

  @Column({ length: 12 })
  unit: string;

  @ManyToOne(() => Product, (product) => product.productIngredients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.productIngredients, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;
}
