import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1771008934721 implements MigrationInterface {
    name = 'InitialSchema1771008934721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ingredients" ("id" SERIAL NOT NULL, "name" character varying(120) NOT NULL, "unit" character varying(12) NOT NULL, "stock_quantity" numeric(12,3) NOT NULL DEFAULT '0', "minimum_quantity" numeric(12,3) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a955029b22ff66ae9fef2e161f8" UNIQUE ("name"), CONSTRAINT "PK_9240185c8a5507251c9f15e0649" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_ingredients" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "ingredient_id" integer NOT NULL, "quantity" numeric(12,3) NOT NULL, "unit" character varying(12) NOT NULL, CONSTRAINT "UQ_product_ingredient" UNIQUE ("product_id", "ingredient_id"), CONSTRAINT "PK_82b8cf241e3716a8d4682e79190" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "name" character varying(120) NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "image_url" text, "is_active" boolean NOT NULL DEFAULT true, "category_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying(80) NOT NULL, "slug" character varying(120) NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clients" ("id" SERIAL NOT NULL, "name" character varying(120) NOT NULL, "phone" character varying(20) NOT NULL, "address_line" character varying(200), "neighborhood" character varying(120), "city" character varying(120), "state" character varying(2), "zip_code" character varying(10), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_aa22377d7d3e794ae4cd39cd9e5" UNIQUE ("phone"), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'kitchen')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying(120) NOT NULL, "email" character varying(160) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'admin', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_ingredients" ADD CONSTRAINT "FK_04c6e59f037eb2a72ca672d44f5" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_ingredients" ADD CONSTRAINT "FK_2da52a63061f2c51bb4dacb4ef5" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`);
        await queryRunner.query(`ALTER TABLE "product_ingredients" DROP CONSTRAINT "FK_2da52a63061f2c51bb4dacb4ef5"`);
        await queryRunner.query(`ALTER TABLE "product_ingredients" DROP CONSTRAINT "FK_04c6e59f037eb2a72ca672d44f5"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "product_ingredients"`);
        await queryRunner.query(`DROP TABLE "ingredients"`);
    }

}
