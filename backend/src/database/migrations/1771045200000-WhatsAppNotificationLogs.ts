import { MigrationInterface, QueryRunner } from 'typeorm';

export class WhatsAppNotificationLogs1771045200000 implements MigrationInterface {
  name = 'WhatsAppNotificationLogs1771045200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "whatsapp_notification_logs" ("id" SERIAL NOT NULL, "order_id" integer, "channel" character varying(30) NOT NULL, "event_type" character varying(60) NOT NULL, "to_phone" character varying(20), "message" text NOT NULL, "attempt" integer NOT NULL, "success" boolean NOT NULL, "provider_status_code" integer, "error_message" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c79b89d1f254cf4cb42de12d7f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_notification_logs" ADD CONSTRAINT "FK_5d0c7b611cb0de6464965cf8966" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "whatsapp_notification_logs" DROP CONSTRAINT "FK_5d0c7b611cb0de6464965cf8966"`,
    );
    await queryRunner.query(`DROP TABLE "whatsapp_notification_logs"`);
  }
}
