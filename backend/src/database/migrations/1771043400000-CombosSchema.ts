import { MigrationInterface, QueryRunner } from 'typeorm';

export class CombosSchema1771043400000 implements MigrationInterface {
  name = 'CombosSchema1771043400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."combos_discount_type_enum" AS ENUM('fixed', 'percentage')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."combo_rules_type_enum" AS ENUM('product', 'category')`,
    );
    await queryRunner.query(
      `CREATE TABLE "combos" ("id" SERIAL NOT NULL, "name" character varying(120) NOT NULL, "description" text, "discount_type" "public"."combos_discount_type_enum" NOT NULL, "discount_value" numeric(12,2) NOT NULL, "starts_at" TIMESTAMP, "ends_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5f4116f4f1af77f2adf8b4f05a9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "combo_rules" ("id" SERIAL NOT NULL, "combo_id" integer NOT NULL, "type" "public"."combo_rules_type_enum" NOT NULL, "product_id" integer, "category_id" integer, "minimum_quantity" integer NOT NULL, CONSTRAINT "PK_7c9226e1cdf9be3ef43204f5e39" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "applied_combo_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "applied_combo_name" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "combo_rules" ADD CONSTRAINT "FK_3c16528d1735f69f6c2f57e2647" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "combo_rules" ADD CONSTRAINT "FK_1d7c72bc31c34add5a53f2d3fbb" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "combo_rules" ADD CONSTRAINT "FK_4e45b95e301cae6f11e09f7b6ff" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_9275f56ae7d3c7fbc7611baf96d" FOREIGN KEY ("applied_combo_id") REFERENCES "combos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_9275f56ae7d3c7fbc7611baf96d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "combo_rules" DROP CONSTRAINT "FK_4e45b95e301cae6f11e09f7b6ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "combo_rules" DROP CONSTRAINT "FK_1d7c72bc31c34add5a53f2d3fbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "combo_rules" DROP CONSTRAINT "FK_3c16528d1735f69f6c2f57e2647"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "applied_combo_name"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "applied_combo_id"`);
    await queryRunner.query(`DROP TABLE "combo_rules"`);
    await queryRunner.query(`DROP TABLE "combos"`);
    await queryRunner.query(`DROP TYPE "public"."combo_rules_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."combos_discount_type_enum"`);
  }
}
