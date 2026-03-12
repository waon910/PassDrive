# PassDrive Operations Guide

## 1. Decision Summary

PassDrive should not move every piece of data into the same database.

- Learner history stays in browser `IndexedDB`
- Admin content and review data move to a relational content store
- Local development target: `SQLite`
- Deployed environments such as Vercel target: `Postgres`

Reasoning:

- learner history is device-local by product design today
- review and publish state must persist across deployments
- admin review needs a writable store on Vercel, which file-backed JSON cannot provide

## 2. Current Safe Operating Mode

The repository is still running with a file-backed content store.

That means:

- learner-facing pages work locally and on Vercel
- local admin review can still save into `data/samples/mvp-sample-question-set.json`
- deployed admin review stays read-only while `CONTENT_STORE_MODE=file`

Use the current mode when you need to keep moving without breaking production.

## 2.1 Optional relational-store mode

The app now has a content-store boundary that can run in three modes:

- `file`
- `sqlite`
- `postgres`

Environment variables:

- `CONTENT_STORE_MODE`
- `CONTENT_DATABASE_URL`
- `CONTENT_DB_AUTO_SEED`

Examples:

```bash
# keep current local JSON workflow
CONTENT_STORE_MODE=file

# local SQLite workflow
CONTENT_STORE_MODE=sqlite
CONTENT_DATABASE_URL=data/content/passdrive.sqlite
CONTENT_DB_AUTO_SEED=true

# deployed Postgres workflow
CONTENT_STORE_MODE=postgres
CONTENT_DATABASE_URL=postgres://...
CONTENT_DB_AUTO_SEED=false
```

## 3. Current Question Addition Workflow

### 3.1 Add or import questions

Use one of the existing import scripts or update the sample dataset manually:

- `scripts/import-jaf-quiz.mjs`
- `scripts/import-car-license-questions.mjs`
- `data/samples/mvp-sample-question-set.json`

When adding new questions:

- create or attach a `SourceReference`
- keep `rightsStatus` as `review_required` unless approval is actually complete
- keep new questions in `translation_review` or another non-published state
- ensure `TranslationReview` and `ExplanationReview` records exist

### 3.2 Validate locally

Run:

```bash
npm run validate:sample
npm run typecheck
npm run build
```

Do not ship content changes that fail any of these checks.

### 3.3 Review and publish locally

Use the local admin review UI:

- approve rights
- approve translation
- approve explanation
- publish locally

This updates the sample dataset file in the repository.

### 3.4 Commit content changes

Once local review is complete:

- commit the updated dataset JSON
- open a PR or merge to the deployment branch

At the current stage, committing the dataset file is the deployment-safe way to ship reviewed content.

## 4. Current Deployment Workflow

### 4.1 Required environment variables

Set at minimum:

- `PASSDRIVE_APP_PASSWORD`

If using a database-backed content store, also set:

- `CONTENT_STORE_MODE`
- `CONTENT_DATABASE_URL`

### 4.2 Deploying to Vercel now

Current production-safe flow:

1. finish content review locally
2. commit the updated dataset file
3. push to Git
4. let Vercel build and deploy the commit

Important:

- do not rely on deployed admin review to persist changes yet
- deployed admin review is for visibility only while file-backed storage remains active

### 4.2.1 Moving to Postgres-backed deploys

Once Postgres is prepared:

1. set `CONTENT_STORE_MODE=postgres`
2. set `CONTENT_DATABASE_URL`
3. run the seed/import step against that database
4. deploy the app

Recommended seed command:

```bash
CONTENT_STORE_MODE=postgres CONTENT_DATABASE_URL=postgres://... npm run content:seed
```

### 4.3 Preview environments

Preview deployments are useful for checking layout and route behavior, but they should not be treated as writable admin environments while content storage is file-backed.

## 5. Target Database Workflow

The next implementation phase should introduce one content-store interface with two relational adapters:

- `SQLite` adapter for local development
- `Postgres` adapter for deployed environments

The same feature code should read and write through that shared boundary.

The JSON dataset should become:

- a seed source
- a fixture source for tests
- a migration/import source

It should stop being the production source of truth.

The repository now includes the initial relational-store runtime and seed command, but the database-backed path still needs end-to-end operational rollout and production validation.

## 6. Target Question Addition Workflow

After the database-backed store is implemented:

1. ingest questions into the relational content store
2. review rights, translation, and explanation in local SQLite or a shared preview database
3. publish through the admin UI
4. let deployed learners read from Postgres-backed published content

At that stage, JSON import remains useful, but publication state should be database-owned.

### 6.1 Local SQLite workflow

Recommended local flow:

1. set `CONTENT_STORE_MODE=sqlite`
2. keep `CONTENT_DATABASE_URL=data/content/passdrive.sqlite`
3. run `npm run content:seed` once, or rely on auto-seed for an empty local database
4. use the app and admin review locally

This keeps local behavior close to the future deployed architecture.

## 7. Cutover Plan

Use this order:

1. implement a database-backed content store behind the current `content-store` boundary
2. keep JSON as the seed/import format
3. seed local SQLite from the current sample dataset
4. seed a Vercel-connected Postgres database for preview
5. switch review actions to the database-backed adapter
6. verify publish and revalidation behavior
7. retire file-backed review for normal operation

## 8. Non-Goals For Now

Do not do these yet:

- move learner history out of browser storage
- add full account-based multi-user auth
- build a complex CMS before the persistence boundary is stable
