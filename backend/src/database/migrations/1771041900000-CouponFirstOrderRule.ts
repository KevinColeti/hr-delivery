import { MigrationInterface, QueryRunner } from 'typeorm';

export class CouponFirstOrderRule1771041900000 implements MigrationInterface {
  name = 'CouponFirstOrderRule1771041900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coupons" ADD "first_order_only" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "coupons" DROP COLUMN "first_order_only"`);
  }
}
