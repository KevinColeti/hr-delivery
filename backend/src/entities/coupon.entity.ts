import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum CouponDiscountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

@Entity({ name: 'coupons' })
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 40 })
  code: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'discount_type',
    type: 'enum',
    enum: CouponDiscountType,
  })
  discountType: CouponDiscountType;

  @Column({ name: 'discount_value', type: 'numeric', precision: 12, scale: 2 })
  discountValue: string;

  @Column({
    name: 'minimum_order_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  minimumOrderAmount: string;

  @Column({ name: 'usage_limit', type: 'integer', nullable: true })
  usageLimit: number | null;

  @Column({ name: 'usage_count', type: 'integer', default: 0 })
  usageCount: number;

  @Column({ name: 'starts_at', type: 'timestamp', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'ends_at', type: 'timestamp', nullable: true })
  endsAt: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Order, (order) => order.appliedCoupon)
  orders: Order[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
