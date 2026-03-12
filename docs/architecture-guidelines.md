# PassDrive Software Architecture Guidelines v0.1

## 1. Purpose

This document defines the target software architecture for PassDrive before feature implementation expands.

The goal is not abstract cleanliness. The goal is to ensure that:

- content quality and review status remain enforceable
- iPad-first product flows stay easy to evolve
- AI agents can add features without breaking content integrity
- the app can move from sample JSON to a real content pipeline without rewrites

## 2. Architectural Priorities

The priorities of this product are ordered as follows.

1. Content integrity
2. Review-safe publication flow
3. iPad learning experience
4. Evolvable feature delivery
5. Performance and maintainability

If two implementation options conflict, choose the one that preserves content integrity and review-safe behavior.

## 3. Core Architectural Principles

### 3.1 Content-first architecture

- Questions, explanations, source references, and review states are product assets, not incidental UI data.
- UI must consume typed content objects, not ad-hoc JSON shapes.
- Raw content and rendered view models must be separated.

### 3.2 Server-first rendering

- Default to React Server Components in the Next.js App Router.
- Add Client Components only for real interaction, device state, timers, answer selection, or local persistence.
- Do not promote components to client-side merely for convenience.

### 3.3 Thin route layer

- Route files in `src/app` compose data and feature modules.
- Business rules must not live directly in route files.
- Route files should stay readable and mostly declarative.

### 3.4 Explicit domain boundaries

- Domain types live in `src/domain`.
- Data loading, parsing, validation, and transformation live in `src/lib`.
- Feature-specific orchestration lives in `src/features`.
- Reusable visual building blocks live in `src/components`.

### 3.5 Review-safe publishing

- No question may be considered publishable unless source rights and review statuses are valid.
- Publishability is a domain rule, not a UI convention.
- Any future ingestion pipeline must preserve auditability of source, translation review, and explanation review.

### 3.6 Offline-tolerant learning

- MVP assumes no account and iPad browser storage.
- Progress persistence must be abstracted behind a storage boundary so IndexedDB can be introduced without rewriting features.

## 4. Target Repository Structure

Use the following structure unless there is a strong reason to deviate.

```text
data/
  samples/                # local sample fixtures and seed datasets
docs/                     # product, architecture, UX, and workflow docs
scripts/                  # validation and content maintenance scripts
src/
  app/                    # routes, layouts, route-level composition
  components/             # reusable presentational UI
  domain/                 # entities, enums, contracts, pure domain helpers
  features/               # feature modules by screen or use case
  lib/                    # data loaders, parsers, formatters, adapters
  styles/                 # optional future shared style tokens
```

Rules:

- `src/app` must not become a dumping ground for business logic.
- `src/lib` must not become a random utilities folder.
- `src/features` should be organized by use case, not by technology.

## 5. Layer Responsibilities

### 5.1 `src/domain`

Allowed:

- entity types
- enums
- domain predicates
- pure business rules
- publishability checks

Not allowed:

- filesystem access
- React rendering
- browser APIs

### 5.2 `src/lib`

Allowed:

- loading datasets
- validating dataset shape
- mapping raw content to feature inputs
- formatting or selector helpers used across features

Not allowed:

- route-specific JSX
- direct mutation of persisted learner state

### 5.3 `src/features`

Allowed:

- feature-level view models
- feature-specific component composition
- local client state for an interaction flow
- feature-scoped selectors and helpers

Not allowed:

- duplicating generic visual primitives already in `src/components`
- bypassing domain types

### 5.4 `src/components`

Allowed:

- reusable layout primitives
- cards, badges, navigation, stat blocks, section headers
- UI that does not own business rules

Not allowed:

- direct JSON loading
- source-rights logic
- feature-specific persistence rules

## 6. Data Flow Rules

The data flow must remain predictable.

1. Content source enters through `data/` or a future ingestion endpoint.
2. `src/lib` loads and validates the dataset.
3. `src/lib` or `src/features` creates feature view models.
4. `src/app` routes pass those models into components.
5. Client state enhances interaction only after typed content is ready.

Never allow:

- route files importing raw JSON directly
- client components re-parsing raw datasets
- visual components deciding whether content is publishable

## 7. Persistence Strategy

### 7.1 Content persistence

Short term:

- validated JSON fixtures in `data/samples`

Mid term:

- structured relational content store with ingestion and review workflow
- local development target: `SQLite`
- deployed environment target: `Postgres`

Rule:

- content storage format must preserve source reference, translation review, explanation review, and version metadata
- feature code must not depend on whether the backing store is JSON, SQLite, or Postgres

### 7.2 Learner progress persistence

Short term:

- client-side storage abstraction targeting IndexedDB

Rule:

- do not couple feature components directly to `localStorage`
- expose learner progress through a dedicated adapter or service boundary
- do not move learner history into the admin content store unless account sync becomes a real product requirement

## 8. Rendering Strategy

### 8.1 Server components by default

Use server components for:

- dashboards
- content browsing
- initial page composition
- dataset-derived summaries

### 8.2 Client components only when required

Use client components for:

- question answer selection
- timers
- interactive exam sessions
- local progress write operations
- animated panels with real interactive state

### 8.3 Static-first until necessary

- If a route can render from validated dataset content, keep it static-friendly.
- Add dynamic behavior only where the learning flow needs it.

## 9. Feature Design Rules

### 9.1 Route ownership

Current expected route ownership:

- `/` or `/home` for dashboard
- `/practice` for setup and guided practice
- `/mock-exam` for exam setup and exam flow
- `/mistakes` for error review
- `/progress` for progress detail
- `/signs-terms` for glossary and road signs

### 9.2 One feature module per use case

Examples:

- `src/features/home`
- `src/features/practice`
- `src/features/mock-exam`
- `src/features/progress`

### 9.3 View-model first composition

- Prefer creating typed view models before writing complex JSX.
- If a page needs multiple cards derived from the same dataset, centralize the mapping logic in the feature module.

## 10. Error Handling and Empty States

- Validation failures must fail loudly in development.
- Missing sample content must show a clear empty state, not silent layout collapse.
- User-facing messaging should remain calm and instructional.

## 11. Accessibility and Performance Requirements

- Maintain semantic headings and landmarks.
- Avoid color-only meaning for correctness or status.
- Ensure tap targets are iPad-friendly.
- Avoid excessive client JavaScript for static content views.

## 12. Testing and Verification Gates

Minimum gates before merging significant work:

- `npm run validate:sample`
- `npm run typecheck`
- `npm run build`

As interactive features are added, extend with:

- unit tests for domain helpers
- feature tests for answer flow and scoring
- visual checks for iPad landscape and portrait

## 13. Non-Negotiable Rules

- Do not bypass typed domain contracts.
- Do not import raw sample JSON directly into route or component files.
- Do not encode publishability rules in CSS or copy only.
- Do not mix learner progress write logic into presentational components.
- Do not create generic utility files with mixed responsibilities.

## 14. Recommended Next Implementation Sequence

1. Establish shared app shell and route structure
2. Build home dashboard from typed feature view models
3. Build practice setup and single-question practice flow
4. Build mock exam setup and exam session shell
5. Add learner-progress storage abstraction
6. Add real content ingestion workflow
