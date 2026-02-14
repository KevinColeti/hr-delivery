import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductExtrasSchema1771033224037 implements MigrationInterface {
    name = 'ProductExtrasSchema1771033224037'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_extras" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "name" character varying(120) NOT NULL, "price" numeric(10,2) NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "ingredient_id" integer, "ingredient_quantity" numeric(12,3), "ingredient_unit" character varying(12), CONSTRAINT "PK_b12af49242fec47cc9990c3f730" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_extras" ADD CONSTRAINT "FK_7ed0b14c8365977cf47e2e15c9d" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_extras" ADD CONSTRAINT "FK_14f33e1ac9ae416895abaec8221" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_extras" DROP CONSTRAINT "FK_14f33e1ac9ae416895abaec8221"`);
        await queryRunner.query(`ALTER TABLE "product_extras" DROP CONSTRAINT "FK_7ed0b14c8365977cf47e2e15c9d"`);
        await queryRunner.query(`DROP TABLE "product_extras"`);
    }

}
