import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderCancellationMetadata1771050500000 implements MigrationInterface {
  name = 'OrderCancellationMetadata1771050500000';

  /**
   * Adiciona metadados de cancelamento para mensagem ao cliente e nota interna.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "cancellation_customer_message" text`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ADD "cancellation_internal_note" text`);
  }

  /**
   * Remove metadados de cancelamento para reverter schema.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "cancellation_internal_note"`);
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "cancellation_customer_message"`,
    );
  }
}
