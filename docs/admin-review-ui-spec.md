# PassDrive Admin Review UI Spec v0.1

## 1. Purpose

This document defines an implementation-ready admin UI for reviewing source rights, English question wording, and explanations before publication.

It is intended for internal operators, not learners.

## 2. Goals

- make review status visible at a glance
- keep unpublished content out of learner routes until approved
- let an operator review one item without leaving the iPad-first product architecture
- preserve auditability of source, translation review, and explanation review

## 3. Non-Goals

- multi-user collaboration
- reviewer assignment workflow
- comments threads
- bulk CSV ingestion UI

## 4. Route Ownership

Add these internal-only routes.

- `/admin/review`
- `/admin/review/questions/[questionId]`

Use server components for page composition.
Use client components only for local form state, filter state, and approve/request-changes actions.

## 5. Proposed File Structure

```text
src/
  app/
    admin/
      review/
        page.tsx
        questions/
          [questionId]/
            page.tsx
  features/
    admin-review/
      get-review-dashboard-view-model.ts
      get-question-review-view-model.ts
      review-actions.ts
      components/
        review-dashboard.tsx
        review-queue-table.tsx
        review-status-summary.tsx
        question-review-shell.tsx
        source-reference-panel.tsx
        translation-review-panel.tsx
        explanation-review-panel.tsx
        review-decision-bar.tsx
  domain/
    review-rules.ts
```

## 6. Data Rules

The admin UI reads the existing typed dataset only.

It must display, at minimum:

- `SourceReference.rightsStatus`
- `Question.status`
- `Question.translationReviewStatus`
- `Question.explanationReviewStatus`
- `TranslationReview`
- `ExplanationReview`
- `Explanation.origin`

The admin UI must never decide publishability in JSX. It should call a domain helper such as:

```ts
canQuestionBePublished(question, sourceReference)
```

## 7. Review Workflow

### 7.1 Queue states

- `Needs source review`
  Condition: `rightsStatus !== approved`
- `Needs translation review`
  Condition: `rightsStatus = approved` and `translationReviewStatus !== approved`
- `Needs explanation review`
  Condition: `rightsStatus = approved` and `translationReviewStatus = approved` and `explanationReviewStatus !== approved`
- `Ready to publish`
  Condition: all three approved and `status = ready`
- `Published`
  Condition: `status = published`

### 7.2 Review action order

1. confirm source rights
2. review English stem and choices
3. review explanation
4. publish

## 8. Dashboard UI

### 8.1 Page intent

The dashboard answers:

- how many items are blocked at each stage
- which question should be reviewed next
- what is publishable now

### 8.2 Layout

Landscape:

- left: compact admin nav
- center: queue table
- right: summary rail

Portrait:

- top: summary row
- middle: queue table
- bottom: sticky filter/action row

### 8.3 Components

#### `ReviewStatusSummary`

Show five stat cards:

- `Needs source review`
- `Needs translation review`
- `Needs explanation review`
- `Ready to publish`
- `Published`

Each card shows:

- count
- short helper text
- one filter action

#### `ReviewQueueTable`

Columns:

- `Question`
- `Category`
- `Source`
- `Rights`
- `Translation`
- `Explanation`
- `Overall`
- `Updated`
- `Open`

Row behavior:

- whole row is clickable
- `Open review` button remains explicit
- status cells use text plus badge, not color alone

### 8.4 Filters

Required filters:

- by overall stage
- by category
- by source
- by explanation origin

Optional search:

- question id
- stem text
- source name

## 9. Question Review Detail UI

### 9.1 Page intent

The detail page is a single-question review workspace.

It should let the reviewer compare:

- source context
- learner-facing English question
- learner-facing explanation
- current review records

### 9.2 Layout

Landscape:

- left panel: question and choices
- center panel: explanation
- right panel: source and review metadata

Portrait:

- top section: question
- next section: explanation
- next section: source and metadata
- bottom sticky action bar

### 9.3 Sections

#### `QuestionReviewShell`

Header content:

- question id
- category
- overall stage badge
- last updated timestamp
- `Previous in queue`
- `Next in queue`

#### `SourceReferencePanel`

Show:

- source name
- publisher
- source URL
- original language
- fetched date
- rights status
- rights notes

Primary actions:

- `Approve source rights`
- `Mark rights for follow-up`
- `Reject source`

#### `TranslationReviewPanel`

Show:

- original stem
- English stem
- choices
- translation review status
- previous review notes

Checklist:

- `Meaning preserved`
- `Natural English`
- `Fits exam style`

Primary actions:

- `Approve translation`
- `Request changes`

Notes field:

- multiline text
- required when requesting changes

#### `ExplanationReviewPanel`

Show:

- explanation origin
- explanation body
- explanation review status
- previous review notes

Checklist:

- `Legally accurate`
- `Clear to learner`
- `Consistent with answer`

Primary actions:

- `Approve explanation`
- `Request changes`

Notes field:

- multiline text
- required when requesting changes

#### `ReviewDecisionBar`

Sticky bottom bar.

States:

- if source not approved: publish button disabled
- if translation pending: publish button disabled
- if explanation pending: publish button disabled
- if all approved and `status !== published`: `Publish question`
- if already published: `Unpublish`

## 10. Status Mapping to UI

### 10.1 Before review

Learner UI:

- question is invisible
- not counted in Home published count
- not available in Practice
- not available in Mock Exam

Admin UI:

- row appears in queue
- overall badge shows `Needs source review` or `Needs translation review`
- detail page shows disabled `Publish question`

### 10.2 After translation approved only

Learner UI:

- still invisible

Admin UI:

- row moves to `Needs explanation review`
- translation panel shows approved badge
- explanation panel remains actionable

### 10.3 After all reviews approved but before publish

Learner UI:

- still invisible

Admin UI:

- row moves to `Ready to publish`
- `Publish question` button becomes enabled

### 10.4 After publish

Learner UI:

- question becomes visible everywhere published content is used

Admin UI:

- row moves to `Published`
- badges show approved state
- primary action becomes `Unpublish`

## 11. View Model Contracts

### 11.1 Dashboard

```ts
interface ReviewDashboardItem {
  questionId: string;
  englishStem: string;
  categoryLabel: string;
  sourceName: string;
  rightsStatus: RightsStatus;
  translationReviewStatus: ReviewStatus;
  explanationReviewStatus: ReviewStatus;
  overallStage:
    | "needs_source_review"
    | "needs_translation_review"
    | "needs_explanation_review"
    | "ready_to_publish"
    | "published";
  updatedAt: string;
}

interface ReviewDashboardViewModel {
  summary: {
    needsSourceReview: number;
    needsTranslationReview: number;
    needsExplanationReview: number;
    readyToPublish: number;
    published: number;
  };
  items: ReviewDashboardItem[];
}
```

### 11.2 Detail

```ts
interface QuestionReviewViewModel {
  question: QuestionBundle;
  sourceReference: SourceReference;
  translationReview?: TranslationReview;
  explanationReview?: ExplanationReview;
  overallStage:
    | "needs_source_review"
    | "needs_translation_review"
    | "needs_explanation_review"
    | "ready_to_publish"
    | "published";
  canPublish: boolean;
}
```

## 12. Domain Helpers

Add these pure helpers in `src/domain/review-rules.ts`.

```ts
export type ReviewQueueStage =
  | "needs_source_review"
  | "needs_translation_review"
  | "needs_explanation_review"
  | "ready_to_publish"
  | "published";

export function getReviewQueueStage(question: Question, source: SourceReference): ReviewQueueStage;

export function canPublishQuestion(question: Question, source: SourceReference): boolean;
```

Rules:

- if `question.status === "published"` return `published`
- else if `source.rightsStatus !== "approved"` return `needs_source_review`
- else if `question.translationReviewStatus !== "approved"` return `needs_translation_review`
- else if `question.explanationReviewStatus !== "approved"` return `needs_explanation_review`
- else return `ready_to_publish`

## 13. Admin Actions

Define server actions or future API handlers for:

- `approveSourceRights(sourceReferenceId)`
- `markSourceReviewRequired(sourceReferenceId, notes)`
- `rejectSourceRights(sourceReferenceId, notes)`
- `approveTranslation(questionId, notes)`
- `requestTranslationChanges(questionId, notes)`
- `approveExplanation(explanationId, notes)`
- `requestExplanationChanges(explanationId, notes)`
- `publishQuestion(questionId)`
- `archiveQuestion(questionId)`

## 14. Copy Rules

All learner-facing copy stays English.
Admin UI may be English-only as well for consistency.

Recommended labels:

- `Needs translation review`
- `Needs explanation review`
- `Ready to publish`
- `Request changes`
- `Approve and continue`

## 15. Acceptance Criteria

- unpublished questions never appear in learner routes
- every review stage is visible from the dashboard without opening detail
- a reviewer can approve translation and explanation from one detail page
- publish action is disabled until source rights and both review states are approved
- publish action immediately makes the question visible in learner routes
- request-changes action requires a note

