import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'whatsapp_notification_logs' })
export class WhatsAppNotificationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id', type: 'integer', nullable: true })
  orderId: number | null;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;

  @Column({ length: 30 })
  channel: string;

  @Column({ name: 'event_type', length: 60 })
  eventType: string;

  @Column({ name: 'to_phone', type: 'varchar', length: 20, nullable: true })
  toPhone: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'integer' })
  attempt: number;

  @Column({ type: 'boolean' })
  success: boolean;

  @Column({ name: 'provider_status_code', type: 'integer', nullable: true })
  providerStatusCode: number | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
