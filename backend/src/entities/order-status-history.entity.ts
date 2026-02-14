import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { User } from './user.entity';

@Entity({ name: 'order_status_history' })
export class OrderStatusHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({
    name: 'previous_status',
    type: 'enum',
    enum: OrderStatus,
    enumName: 'orders_status_enum',
  })
  previousStatus: OrderStatus;

  @Column({
    name: 'next_status',
    type: 'enum',
    enum: OrderStatus,
    enumName: 'orders_status_enum',
  })
  nextStatus: OrderStatus;

  @Column({ name: 'changed_by_user_id', type: 'integer', nullable: true })
  changedByUserId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'changed_by_user_id' })
  changedByUser: User | null;

  @Column({ name: 'changed_by_name', type: 'varchar', length: 120, nullable: true })
  changedByName: string | null;

  @Column({ name: 'changed_by_email', type: 'varchar', length: 160, nullable: true })
  changedByEmail: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
