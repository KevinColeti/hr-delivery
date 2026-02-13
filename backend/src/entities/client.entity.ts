import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'clients' })
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ unique: true, length: 20 })
  phone: string;

  @Column({ name: 'address_line', type: 'varchar', length: 200, nullable: true })
  addressLine: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  neighborhood: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  state: string | null;

  @Column({ name: 'zip_code', type: 'varchar', length: 10, nullable: true })
  zipCode: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
