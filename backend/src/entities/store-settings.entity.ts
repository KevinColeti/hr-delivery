import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'store_settings' })
export class StoreSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_name', type: 'varchar', length: 120, default: 'HR Na Chapa' })
  storeName: string;

  @Column({ name: 'store_description', type: 'text', nullable: true })
  storeDescription: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'contact_whatsapp', type: 'varchar', length: 20, nullable: true })
  contactWhatsApp: string | null;

  @Column({
    name: 'delivery_fee_default',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  deliveryFeeDefault: string;

  @Column({
    name: 'minimum_order_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  minimumOrderAmount: string;

  @Column({ name: 'service_area_description', type: 'text', nullable: true })
  serviceAreaDescription: string | null;

  @Column({ name: 'operating_hours_description', type: 'text', nullable: true })
  operatingHoursDescription: string | null;

  @Column({ name: 'is_store_open', type: 'boolean', default: true })
  isStoreOpen: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
