import Link from "next/link";

import { QuestionFigure } from "@/components/question-figure";
import { formatQuestionStatusLabel, formatQuestionTypeLabel, getOrderedChoices } from "@/domain/content-rules";
import type { QuestionReviewViewModel } from "@/features/admin-review/get-question-review-view-model";
import { publishQuestionAction, unpublishQuestionAction } from "@/features/admin-review/review-actions";

interface QuestionReviewShellProps {
  viewModel: QuestionReviewViewModel;
}

export function QuestionReviewShell({ viewModel }: QuestionReviewShellProps) {
  const { bundle, canPublish } = viewModel;
  const controlsDisabled = !viewModel.contentStore.runtimeWritable;
  const isPublished = bundle.question.status === "published";

  return (
    <section className="single-column-grid">
      {controlsDisabled ? (
        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Storage Mode</p>
              <h2>This deployment cannot save visibility changes.</h2>
            </div>
            <span className="chip">File store</span>
          </div>

          <p className="small-copy">
            The current content store is still file-backed. Deployments on Vercel are read-only for this workflow, so
            publish and unpublish actions stay disabled until the admin data moves to a database.
          </p>
        </article>
      ) : null}

      <article className="surface-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Question Detail</p>
            <h2>{bundle.question.id}</h2>
          </div>
          <span className="chip">{formatQuestionStatusLabel(bundle.question.status)}</span>
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
            Back to List
          </Link>
          {isPublished ? (
            <form action={unpublishQuestionAction}>
              <input type="hidden" name="questionId" value={bundle.question.id} />
              <button className="secondary-button danger-button" type="submit" disabled={controlsDisabled}>
                Unpublish Question
              </button>
            </form>
          ) : (
            <form action={publishQuestionAction}>
              <input type="hidden" name="questionId" value={bundle.question.id} />
              <button className="primary-button" type="submit" disabled={!canPublish || controlsDisabled}>
                Publish Question
              </button>
            </form>
          )}
        </div>
      </article>

      <div className="admin-review-layout">
        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Question</p>
              <h2>Learner-facing copy</h2>
            </div>
            <span className="chip">{bundle.choices.length} choices</span>
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
            {getOrderedChoices(bundle.question, bundle.choices).map((choice) => (
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
        </article>

        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Explanation</p>
              <h2>Why this answer is correct</h2>
            </div>
            <span className="chip">{bundle.explanation.origin}</span>
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
        </article>

        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Source</p>
              <h2>Source context</h2>
            </div>
            <span className="chip">{bundle.sourceReference.originalLanguage}</span>
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

          {bundle.sourceReference.rightsNotes ? (
            <div className="admin-review-note">
              <strong>Source notes</strong>
              <p className="small-copy">{bundle.sourceReference.rightsNotes}</p>
            </div>
          ) : null}

          {bundle.tags.length > 0 ? (
            <div className="admin-tag-row">
              {bundle.tags.map((tag) => (
                <span key={tag.id} className="category-chip">
                  {tag.labelEn}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
