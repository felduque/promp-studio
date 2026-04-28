import { MigrationInterface, QueryRunner } from 'typeorm';

export class TemplatesChatVersionsStudioIo1770000000000 implements MigrationInterface {
  name = 'TemplatesChatVersionsStudioIo1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      ALTER TABLE "prompts"
      ADD COLUMN IF NOT EXISTS "currentChatVersionId" uuid
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "prompt_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "isSystem" boolean NOT NULL DEFAULT false,
        "name" character varying NOT NULL,
        "description" text,
        "content" text NOT NULL,
        "variables" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "messages" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_prompt_templates_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "isSystem" boolean NOT NULL DEFAULT false,
        "name" character varying NOT NULL,
        "description" text,
        "systemMessage" text,
        "userMessage" text,
        "assistantMessage" text,
        "messages" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "variables" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "parameters" jsonb,
        "provider" character varying,
        "model" character varying,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_templates_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "promptId" uuid NOT NULL,
        "versionNumber" integer NOT NULL,
        "systemMessage" text,
        "userMessage" text,
        "assistantMessage" text,
        "messages" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "variables" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "parameters" jsonb,
        "provider" character varying,
        "model" character varying,
        "parentVersionId" uuid,
        "authorId" uuid,
        "commitMessage" character varying,
        "tag" character varying,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_versions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "executions"
      ADD COLUMN IF NOT EXISTS "chatVersionId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "execution_groups"
      ADD COLUMN IF NOT EXISTS "chatVersionId" uuid
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_prompt_templates_userId" ON "prompt_templates" ("userId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_prompt_templates_isSystem" ON "prompt_templates" ("isSystem")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_chat_templates_userId" ON "chat_templates" ("userId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_chat_templates_isSystem" ON "chat_templates" ("isSystem")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_chat_versions_promptId" ON "chat_versions" ("promptId")',
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_prompt_templates_userId') THEN
          ALTER TABLE "prompt_templates"
          ADD CONSTRAINT "FK_prompt_templates_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_chat_templates_userId') THEN
          ALTER TABLE "chat_templates"
          ADD CONSTRAINT "FK_chat_templates_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_chat_versions_promptId') THEN
          ALTER TABLE "chat_versions"
          ADD CONSTRAINT "FK_chat_versions_promptId" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_chat_versions_parentVersionId') THEN
          ALTER TABLE "chat_versions"
          ADD CONSTRAINT "FK_chat_versions_parentVersionId" FOREIGN KEY ("parentVersionId") REFERENCES "chat_versions"("id") ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_chat_versions_authorId') THEN
          ALTER TABLE "chat_versions"
          ADD CONSTRAINT "FK_chat_versions_authorId" FOREIGN KEY ("authorId") REFERENCES "users"("id");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_executions_chatVersionId') THEN
          ALTER TABLE "executions"
          ADD CONSTRAINT "FK_executions_chatVersionId" FOREIGN KEY ("chatVersionId") REFERENCES "chat_versions"("id") ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_execution_groups_chatVersionId') THEN
          ALTER TABLE "execution_groups"
          ADD CONSTRAINT "FK_execution_groups_chatVersionId" FOREIGN KEY ("chatVersionId") REFERENCES "chat_versions"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "execution_groups" DROP CONSTRAINT IF EXISTS "FK_execution_groups_chatVersionId"',
    );
    await queryRunner.query(
      'ALTER TABLE "executions" DROP CONSTRAINT IF EXISTS "FK_executions_chatVersionId"',
    );
    await queryRunner.query(
      'ALTER TABLE "chat_versions" DROP CONSTRAINT IF EXISTS "FK_chat_versions_authorId"',
    );
    await queryRunner.query(
      'ALTER TABLE "chat_versions" DROP CONSTRAINT IF EXISTS "FK_chat_versions_parentVersionId"',
    );
    await queryRunner.query(
      'ALTER TABLE "chat_versions" DROP CONSTRAINT IF EXISTS "FK_chat_versions_promptId"',
    );
    await queryRunner.query(
      'ALTER TABLE "chat_templates" DROP CONSTRAINT IF EXISTS "FK_chat_templates_userId"',
    );
    await queryRunner.query(
      'ALTER TABLE "prompt_templates" DROP CONSTRAINT IF EXISTS "FK_prompt_templates_userId"',
    );
    await queryRunner.query(
      'ALTER TABLE "execution_groups" DROP COLUMN IF EXISTS "chatVersionId"',
    );
    await queryRunner.query(
      'ALTER TABLE "executions" DROP COLUMN IF EXISTS "chatVersionId"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "chat_versions"');
    await queryRunner.query('DROP TABLE IF EXISTS "chat_templates"');
    await queryRunner.query('DROP TABLE IF EXISTS "prompt_templates"');
    await queryRunner.query(
      'ALTER TABLE "prompts" DROP COLUMN IF EXISTS "currentChatVersionId"',
    );
  }
}
