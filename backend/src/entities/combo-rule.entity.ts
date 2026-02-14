import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { Combo } from './combo.entity';
import { Product } from './product.entity';

export enum ComboRuleType {
  PRODUCT = 'product',
  CATEGORY = 'category',
}

@Entity({ name: 'combo_rules' })
export class ComboRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'combo_id' })
  comboId: number;

  @ManyToOne(() => Combo, (combo) => combo.rules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'combo_id' })
  combo: Combo;

  @Column({
    type: 'enum',
    enum: ComboRuleType,
  })
  type: ComboRuleType;

  @Column({ name: 'product_id', nullable: true, type: 'integer' })
  productId: number | null;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  @Column({ name: 'category_id', nullable: true, type: 'integer' })
  categoryId: number | null;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ name: 'minimum_quantity', type: 'integer' })
  minimumQuantity: number;
}
