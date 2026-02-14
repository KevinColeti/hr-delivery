import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { Order } from './order.entity';

export enum StockMovementType {
  ENTRY = 'entry',
  EXIT = 'exit',
  ADJUSTMENT = 'adjustment',
}

export enum StockMovementSource {
  MANUAL = 'manual',
  ORDER_CONFIRMATION = 'order_confirmation',
}

@Entity({ name: 'stock_movements' })
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ingredient_id' })
  ingredientId: number;

  @ManyToOne(() => Ingredient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ name: 'order_id', nullable: true })
  orderId: number | null;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;

  @Column({
    type: 'enum',
    enum: StockMovementType,
  })
  type: StockMovementType;

  @Column({
    type: 'enum',
    enum: StockMovementSource,
    default: StockMovementSource.MANUAL,
  })
  source: StockMovementSource;

  @Column({ name: 'quantity_change', type: 'numeric', precision: 12, scale: 3 })
  quantityChange: string;

  @Column({ name: 'stock_before', type: 'numeric', precision: 12, scale: 3 })
  stockBefore: string;

  @Column({ name: 'stock_after', type: 'numeric', precision: 12, scale: 3 })
  stockAfter: string;

  @Column({ length: 180 })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
