# PassDrive

English-first study app for the Japanese driver's license written test, designed around iPad use.

## Current state

This repository now includes:

- product requirements in `docs/`
- architecture and UI/UX guidelines in `docs/`
- repository-specific AI agent instructions in `AGENTS.md`
- a validated sample dataset in `data/samples/`
- domain types in `src/domain/content-types.ts`
- a typed sample-data loader in `src/lib/sample-dataset.ts`
- an initial Next.js app shell in `src/app/`

## Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run validate:sample
npm run content:seed
```

## Shared access password

If you want a simple site-wide password gate, set `PASSDRIVE_APP_PASSWORD`.

```bash
PASSDRIVE_APP_PASSWORD=your-shared-password
```

The gate is intentionally lightweight. It is meant to keep casual visitors out, not to replace real user authentication.

## Deployment note

The current admin review flow writes back to `data/samples/mvp-sample-question-set.json`. That works for local development, but it is not a durable production persistence strategy on Vercel. To keep review and publish changes after deployment, move that workflow to a real database or another persistent store before relying on it in production.

Recommended direction:

- learner history stays in browser `IndexedDB`
- content browsing can keep using typed dataset view models
- admin review and publish state should move to a relational content store
- local development should target `SQLite`
- deployed environments such as Vercel should target `Postgres`

Current relational-store controls:

- `CONTENT_STORE_MODE=file|sqlite|postgres`
- `CONTENT_DATABASE_URL=...`
- `CONTENT_DB_AUTO_SEED=true|false`

## Key files

- `AGENTS.md`
- `docs/architecture-guidelines.md`
- `docs/operations.md`
- `docs/uiux-guidelines.md`
- `data/samples/mvp-sample-question-set.json`
- `src/domain/content-types.ts`
- `src/lib/sample-dataset.ts`
- `src/app/page.tsx`

## Recommended next steps

1. Build the real iPad dashboard and practice flow on top of the typed loader.
2. Add more sample questions so category filtering and mock-exam selection can be exercised.
3. Introduce a real content-ingestion pipeline for source capture, translation review, and explanation review.
