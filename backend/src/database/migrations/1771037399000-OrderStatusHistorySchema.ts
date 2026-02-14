import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderStatusHistorySchema1771037399000 implements MigrationInterface {
  name = 'OrderStatusHistorySchema1771037399000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "order_status_history" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "previous_status" "public"."orders_status_enum" NOT NULL, "next_status" "public"."orders_status_enum" NOT NULL, "changed_by_user_id" integer, "changed_by_name" character varying(120), "changed_by_email" character varying(160), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eea9e3f48cb0cd5ef6f4f4fa8c8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_history" ADD CONSTRAINT "FK_8f9b7ca9f67a0f1cf265ba663f3" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_history" ADD CONSTRAINT "FK_f33beaf572dfce0f4b1707dc510" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_status_history" DROP CONSTRAINT "FK_f33beaf572dfce0f4b1707dc510"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_history" DROP CONSTRAINT "FK_8f9b7ca9f67a0f1cf265ba663f3"`,
    );
    await queryRunner.query(`DROP TABLE "order_status_history"`);
  }
}
