import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderItemExtrasSchema1771049300000 implements MigrationInterface {
  name = 'OrderItemExtrasSchema1771049300000';

  /**
   * Cria estrutura de extras por item de pedido com FKs de referencia.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "order_item_extras" ("id" SERIAL NOT NULL, "order_item_id" integer NOT NULL, "product_extra_id" integer, "extra_name" character varying(120) NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unit_price" numeric(12,2) NOT NULL, "line_total" numeric(12,2) NOT NULL, "ingredient_id" integer, "ingredient_quantity" numeric(12,3), "ingredient_unit" character varying(12), CONSTRAINT "PK_578ba17a2facd4f33fd1ad26cfd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_extras" ADD CONSTRAINT "FK_912c4d7057562c5a1922f7b6ca0" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_extras" ADD CONSTRAINT "FK_c53b8819635457f39b8cae7b669" FOREIGN KEY ("product_extra_id") REFERENCES "product_extras"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_extras" ADD CONSTRAINT "FK_5d1d9a2c3adf9cc98fc09aab72f" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  /**
   * Reverte estrutura de extras por item de pedido.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_item_extras" DROP CONSTRAINT "FK_5d1d9a2c3adf9cc98fc09aab72f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_extras" DROP CONSTRAINT "FK_c53b8819635457f39b8cae7b669"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_extras" DROP CONSTRAINT "FK_912c4d7057562c5a1922f7b6ca0"`,
    );
    await queryRunner.query(`DROP TABLE "order_item_extras"`);
  }
}
