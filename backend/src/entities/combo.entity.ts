import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ComboRule } from './combo-rule.entity';
import { Order } from './order.entity';

export enum ComboDiscountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

@Entity({ name: 'combos' })
export class Combo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'discount_type',
    type: 'enum',
    enum: ComboDiscountType,
  })
  discountType: ComboDiscountType;

  @Column({ name: 'discount_value', type: 'numeric', precision: 12, scale: 2 })
  discountValue: string;

  @Column({ name: 'starts_at', type: 'timestamp', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'ends_at', type: 'timestamp', nullable: true })
  endsAt: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ComboRule, (rule) => rule.combo, { cascade: true })
  rules: ComboRule[];

  @OneToMany(() => Order, (order) => order.appliedCombo)
  orders: Order[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
