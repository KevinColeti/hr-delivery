import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { OrderItem } from './order-item.entity';
import { ProductExtra } from './product-extra.entity';

@Entity({ name: 'order_item_extras' })
/**
 * Snapshot de extras selecionados em cada item de pedido.
 *
 * Mantemos snapshot de nome/preco/consumo para preservar historico mesmo se
 * o cadastro de extra mudar no futuro.
 */
export class OrderItemExtra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_item_id' })
  orderItemId: number;

  @Column({ name: 'product_extra_id', type: 'integer', nullable: true })
  productExtraId: number | null;

  @Column({ name: 'extra_name', length: 120 })
  extraName: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice: string;

  @Column({ name: 'line_total', type: 'numeric', precision: 12, scale: 2 })
  lineTotal: string;

  @Column({ name: 'ingredient_id', type: 'integer', nullable: true })
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

  @ManyToOne(() => OrderItem, (orderItem) => orderItem.extras, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @ManyToOne(() => ProductExtra, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_extra_id' })
  productExtra: ProductExtra | null;

  @ManyToOne(() => Ingredient, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient | null;
}

