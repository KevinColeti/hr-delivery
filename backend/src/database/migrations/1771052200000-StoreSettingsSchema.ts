import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoreSettingsSchema1771052200000 implements MigrationInterface {
  name = 'StoreSettingsSchema1771052200000';

  /**
   * Cria tabela de configuracoes operacionais da loja.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "store_settings" ("id" SERIAL NOT NULL, "store_name" character varying(120) NOT NULL DEFAULT 'HR Na Chapa', "store_description" text, "contact_phone" character varying(20), "contact_whatsapp" character varying(20), "delivery_fee_default" numeric(12,2) NOT NULL DEFAULT '0', "minimum_order_amount" numeric(12,2) NOT NULL DEFAULT '0', "service_area_description" text, "operating_hours_description" text, "is_store_open" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_97f0467a0e2f4f0e2ea8d7a6216" PRIMARY KEY ("id"))`,
    );
  }

  /**
   * Remove tabela de configuracoes operacionais da loja.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "store_settings"`);
  }
}
