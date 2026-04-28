# Templates, chat versions and DB sync

This feature adds these persistent tables/columns:

- `prompt_templates`
- `chat_templates`
- `chat_versions`
- `prompts.currentChatVersionId`
- `executions.chatVersionId`
- `execution_groups.chatVersionId`

Development currently uses TypeORM `synchronize` when `NODE_ENV !== production`, so a clean local DB will be aligned automatically when the API starts. The repository also includes migration `1770000000000-TemplatesChatVersionsStudioIo.ts` for environments that run migrations explicitly.

## Local DB reset

Use a reset when the local database has drifted from the entity schema or from an earlier failed feature attempt:

```bash
npm run docker:reset
npm run dev:api
```

`docker:reset` runs `docker compose down -v && docker compose up -d`, so it deletes the local PostgreSQL volume. Export any data you need before running it.

## Existing local DB without reset

If keeping local data matters, start the API once in development so TypeORM `synchronize` can add the missing schema pieces. If startup fails because the previous database has incompatible constraints or partial tables from a failed attempt, prefer the reset path above.

## Production note

Do not rely on `synchronize` in production. Apply the migration before deploying the API code that references the new entities and columns.
