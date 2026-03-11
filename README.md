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
```

## Key files

- `AGENTS.md`
- `docs/architecture-guidelines.md`
- `docs/uiux-guidelines.md`
- `data/samples/mvp-sample-question-set.json`
- `src/domain/content-types.ts`
- `src/lib/sample-dataset.ts`
- `src/app/page.tsx`

## Recommended next steps

1. Build the real iPad dashboard and practice flow on top of the typed loader.
2. Add more sample questions so category filtering and mock-exam selection can be exercised.
3. Introduce a real content-ingestion pipeline for source capture, translation review, and explanation review.
