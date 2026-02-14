import { MigrationInterface, QueryRunner } from 'typeorm';

export class StockMovementsSchema1771035481000 implements MigrationInterface {
  name = 'StockMovementsSchema1771035481000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."stock_movements_type_enum" AS ENUM('entry', 'exit', 'adjustment')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stock_movements_source_enum" AS ENUM('manual', 'order_confirmation')`,
    );
    await queryRunner.query(
      `CREATE TABLE "stock_movements" ("id" SERIAL NOT NULL, "ingredient_id" integer NOT NULL, "order_id" integer, "type" "public"."stock_movements_type_enum" NOT NULL, "source" "public"."stock_movements_source_enum" NOT NULL DEFAULT 'manual', "quantity_change" numeric(12,3) NOT NULL, "stock_before" numeric(12,3) NOT NULL, "stock_after" numeric(12,3) NOT NULL, "reason" character varying(180) NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_74fd7efe8afcae14ab4ef8f2ce7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_4a50e67f6fc0b9f98d4326f3da1" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_47b3fbc5e0f4a59621618fbe3e8" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_47b3fbc5e0f4a59621618fbe3e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_4a50e67f6fc0b9f98d4326f3da1"`,
    );
    await queryRunner.query(`DROP TABLE "stock_movements"`);
    await queryRunner.query(`DROP TYPE "public"."stock_movements_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."stock_movements_type_enum"`);
  }
}
