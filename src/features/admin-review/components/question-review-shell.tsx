import Link from "next/link";

import { QuestionFigure } from "@/components/question-figure";
import { formatQuestionTypeLabel, formatReviewStatusLabel, formatRightsStatusLabel } from "@/domain/content-rules";
import { formatReviewQueueStageLabel } from "@/domain/review-rules";
import type { QuestionReviewViewModel } from "@/features/admin-review/get-question-review-view-model";
import {
  approveExplanationAction,
  approveSourceRightsAction,
  approveTranslationAction,
  publishQuestionAction,
  requestExplanationChangesAction,
  requestSourceFollowUpAction,
  requestTranslationChangesAction
} from "@/features/admin-review/review-actions";

interface QuestionReviewShellProps {
  viewModel: QuestionReviewViewModel;
}

export function QuestionReviewShell({ viewModel }: QuestionReviewShellProps) {
  const { bundle, canPublish, stage, translationReview, explanationReview } = viewModel;

  return (
    <section className="single-column-grid">
      <article className="surface-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Question Review</p>
            <h2>{bundle.question.id}</h2>
          </div>
          <span className="chip">{formatReviewQueueStageLabel(stage)}</span>
        </div>

        <p className="small-copy">
          {bundle.category.labelEn}
          {" · "}
          {formatQuestionTypeLabel(bundle.question.questionType)}
          {" · "}
          Updated {bundle.question.updatedAt.slice(0, 10)}
        </p>

        <div className="action-row">
          <Link className="secondary-button link-button" href="/admin/review">
            Back to Queue
          </Link>
          <form action={publishQuestionAction}>
            <input type="hidden" name="questionId" value={bundle.question.id} />
            <button className="primary-button" type="submit" disabled={!canPublish}>
              Publish Question
            </button>
          </form>
        </div>
        {!canPublish ? (
          <p className="small-copy">Publish stays disabled until rights, translation, and explanation are approved.</p>
        ) : null}
      </article>

      <div className="admin-review-layout">
        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Question</p>
              <h2>Learner-facing copy</h2>
            </div>
            <span className="chip">{formatReviewStatusLabel(bundle.question.translationReviewStatus)}</span>
          </div>

          <div className="detail-list">
            <div>
              <dt>Original</dt>
              <dd>{bundle.question.originalStem}</dd>
            </div>
            <div>
              <dt>English</dt>
              <dd>{bundle.question.englishStem}</dd>
            </div>
          </div>

          <QuestionFigure question={bundle.question} size="compact" />

          <div className="stack-list admin-choice-list">
            {bundle.choices.map((choice) => (
              <div key={choice.id} className="list-card">
                <div>
                  <span>
                    {choice.choiceKey}. {choice.englishText}
                  </span>
                  <small>{choice.isCorrect ? "Correct choice" : "Distractor"}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-review-note">
            <strong>Translation review notes</strong>
            <p className="small-copy">{translationReview?.notes ?? "No review record."}</p>
          </div>

          <div className="action-row">
            <form action={approveTranslationAction}>
              <input type="hidden" name="questionId" value={bundle.question.id} />
              <button className="primary-button" type="submit">
                Approve Translation
              </button>
            </form>
            <form action={requestTranslationChangesAction}>
              <input type="hidden" name="questionId" value={bundle.question.id} />
              <button className="secondary-button" type="submit">
                Request Changes
              </button>
            </form>
          </div>
        </article>

        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Explanation</p>
              <h2>Why this answer is correct</h2>
            </div>
            <span className="chip">{formatReviewStatusLabel(bundle.question.explanationReviewStatus)}</span>
          </div>

          <p className="question-stem">{bundle.explanation.bodyEn}</p>

          <div className="detail-list admin-detail-list">
            <div>
              <dt>Origin</dt>
              <dd>{bundle.explanation.origin}</dd>
            </div>
            <div>
              <dt>Source derived</dt>
              <dd>{bundle.explanation.sourceDerived ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>{bundle.explanation.createdBy}</dd>
            </div>
          </div>

          <div className="admin-review-note">
            <strong>Explanation review notes</strong>
            <p className="small-copy">{explanationReview?.notes ?? "No review record."}</p>
          </div>

          <div className="action-row">
            <form action={approveExplanationAction}>
              <input type="hidden" name="questionId" value={bundle.question.id} />
              <input type="hidden" name="explanationId" value={bundle.explanation.id} />
              <button className="primary-button" type="submit">
                Approve Explanation
              </button>
            </form>
            <form action={requestExplanationChangesAction}>
              <input type="hidden" name="questionId" value={bundle.question.id} />
              <input type="hidden" name="explanationId" value={bundle.explanation.id} />
              <button className="secondary-button" type="submit">
                Request Changes
              </button>
            </form>
          </div>
        </article>

        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Source</p>
              <h2>Rights and audit context</h2>
            </div>
            <span className="chip">{formatRightsStatusLabel(bundle.sourceReference.rightsStatus)}</span>
          </div>

          <div className="detail-list admin-detail-list">
            <div>
              <dt>Source</dt>
              <dd>{bundle.sourceReference.sourceName}</dd>
            </div>
            <div>
              <dt>Publisher</dt>
              <dd>{bundle.sourceReference.publisher ?? "n/a"}</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{bundle.sourceReference.originalLanguage}</dd>
            </div>
            <div>
              <dt>Fetched</dt>
              <dd>{bundle.sourceReference.fetchedAt.slice(0, 10)}</dd>
            </div>
            <div>
              <dt>URL</dt>
              <dd>
                {bundle.sourceReference.sourceUrl ? (
                  <a href={bundle.sourceReference.sourceUrl} target="_blank" rel="noreferrer">
                    Open source
                  </a>
                ) : (
                  "n/a"
                )}
              </dd>
            </div>
          </div>

          <div className="admin-review-note">
            <strong>Rights notes</strong>
            <p className="small-copy">{bundle.sourceReference.rightsNotes ?? "No rights notes."}</p>
          </div>

          {bundle.tags.length > 0 ? (
            <div className="admin-tag-row">
              {bundle.tags.map((tag) => (
                <span key={tag.id} className="category-chip">
                  {tag.labelEn}
                </span>
              ))}
            </div>
          ) : null}

          <div className="action-row">
            <form action={approveSourceRightsAction}>
              <input type="hidden" name="questionId" value={bundle.question.id} />
              <input type="hidden" name="sourceReferenceId" value={bundle.sourceReference.id} />
              <button className="primary-button" type="submit">
                Approve Rights
              </button>
            </form>
            <form action={requestSourceFollowUpAction}>
              <input type="hidden" name="questionId" value={bundle.question.id} />
              <input type="hidden" name="sourceReferenceId" value={bundle.sourceReference.id} />
              <button className="secondary-button" type="submit">
                Keep Pending
              </button>
            </form>
          </div>
        </article>
      </div>
    </section>
  );
}
