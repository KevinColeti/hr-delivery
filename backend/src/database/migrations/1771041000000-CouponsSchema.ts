import { MigrationInterface, QueryRunner } from 'typeorm';

export class CouponsSchema1771041000000 implements MigrationInterface {
  name = 'CouponsSchema1771041000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."coupons_discount_type_enum" AS ENUM('fixed', 'percentage')`,
    );
    await queryRunner.query(
      `CREATE TABLE "coupons" ("id" SERIAL NOT NULL, "code" character varying(40) NOT NULL, "name" character varying(120) NOT NULL, "description" text, "discount_type" "public"."coupons_discount_type_enum" NOT NULL, "discount_value" numeric(12,2) NOT NULL, "minimum_order_amount" numeric(12,2) NOT NULL DEFAULT '0', "usage_limit" integer, "usage_count" integer NOT NULL DEFAULT '0', "starts_at" TIMESTAMP, "ends_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d3004f69475fc816748bf77e5f0" UNIQUE ("code"), CONSTRAINT "PK_7ea5f4b7f763e8d4f48d07206cf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "applied_coupon_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "applied_coupon_code" character varying(40)`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_3640d5f31224a0b39ee84a6df72" FOREIGN KEY ("applied_coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_3640d5f31224a0b39ee84a6df72"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "applied_coupon_code"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "applied_coupon_id"`);
    await queryRunner.query(`DROP TABLE "coupons"`);
    await queryRunner.query(`DROP TYPE "public"."coupons_discount_type_enum"`);
  }
}
