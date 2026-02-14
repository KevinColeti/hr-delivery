import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from './client.entity';
import { Combo } from './combo.entity';
import { Coupon } from './coupon.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  NEW = 'new',
  CONFIRMED = 'confirmed',
  IN_PREPARATION = 'in_preparation',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
}

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @ManyToOne(() => Client, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'orders_status_enum',
    default: OrderStatus.NEW,
  })
  status: OrderStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal: string;

  @Column({ name: 'delivery_fee', type: 'numeric', precision: 12, scale: 2, default: 0 })
  deliveryFee: string;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  discountAmount: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'applied_coupon_id', type: 'integer', nullable: true })
  appliedCouponId: number | null;

  @ManyToOne(() => Coupon, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applied_coupon_id' })
  appliedCoupon: Coupon | null;

  @Column({
    name: 'applied_coupon_code',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  appliedCouponCode: string | null;

  @Column({ name: 'applied_combo_id', type: 'integer', nullable: true })
  appliedComboId: number | null;

  @ManyToOne(() => Combo, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applied_combo_id' })
  appliedCombo: Combo | null;

  @Column({
    name: 'applied_combo_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  appliedComboName: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
