# PassDrive AGENT Instructions

This file defines repository-specific rules for AI coding agents working in this project.

## 1. Read Order Before Coding

Before making significant changes, read these files in order:

1. `docs/requirements.md`
2. `docs/data-schema.md`
3. `docs/screen-flow.md`
4. `docs/architecture-guidelines.md`
5. `docs/uiux-guidelines.md`

Do not implement new screens or data behavior without aligning with those documents.

## 2. Product Context

- Product: English-first study app for the Japanese driver's license written test
- Audience: English-speaking learners taking the Japanese written exam
- Device target: iPad browser
- MVP: practice, mock exam, mistakes review, progress, signs and terms

## 3. Non-Negotiable Rules

- Learner-facing copy must be English.
- Source rights and review state are first-class product concerns.
- Do not bypass typed domain models.
- Do not import raw content JSON directly in route or presentational components.
- Do not mix data loading with reusable UI components.
- Do not treat iPad like a stretched phone layout.

## 4. Architecture Rules

Use these folder responsibilities.

- `src/app`: route entry points and layout composition only
- `src/domain`: entities, enums, pure business rules
- `src/lib`: data loaders, selectors, adapters, shared non-visual helpers
- `src/features`: feature-specific orchestration and view-model composition
- `src/components`: reusable presentational building blocks

Preferred defaults:

- Server Components by default
- Client Components only for interaction, timers, answer selection, or local persistence
- Typed view models before complex JSX

## 5. Data Rules

- All content must flow through the typed dataset loader or future ingestion boundary.
- Publishability rules belong in domain or loader logic, not in display-only code.
- Keep sample data valid with `npm run validate:sample`.
- If you add or modify dataset shape, update:
  `docs/data-schema.md`
  `src/domain/content-types.ts`
  `scripts/validate-sample-data.mjs`

## 6. UI/UX Rules

- Optimize for iPad landscape first, then portrait.
- Keep one primary action per screen.
- Question reading and answer selection must stay visually dominant.
- Avoid generic SaaS dashboard styling.
- Preserve clear mode context: `Practice`, `Mock Exam`, `Mistakes`, `Progress`, `Signs & Terms`.

When building screens, check against `docs/uiux-guidelines.md`.

## 7. Implementation Workflow

For meaningful feature work, follow this order:

1. confirm the relevant requirement and screen definition
2. define or update the typed data shape if needed
3. build selectors or view models
4. implement the route and UI
5. run validation and type checks
6. run a production build when route structure or rendering changes

## 8. Quality Gates

Before considering work complete, run:

```bash
npm run validate:sample
npm run typecheck
npm run build
```

If any of these fail, do not describe the work as complete.

## 9. Current Recommended Direction

Near-term implementation should prioritize:

1. shared iPad app shell and stable navigation
2. home dashboard
3. practice setup and question flow
4. mock exam setup and exam shell
5. progress and mistakes review

## 10. Avoid These Mistakes

- Adding business logic directly to `src/app/page.tsx`
- Creating catch-all utility files with mixed responsibilities
- Using client components for static content pages
- Introducing unreviewed content assumptions into public UI
- Building narrow mobile-first cards and calling the result tablet-ready
