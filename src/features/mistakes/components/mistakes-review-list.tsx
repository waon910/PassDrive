"use client";

import Link from "next/link";

import { QuestionFigure } from "@/components/question-figure";
import type { QuestionBundle } from "@/domain/content-types";
import { mergeMistakeBundlesWithHistory } from "@/lib/learner-history-aggregates";
import { useLearnerHistory } from "@/lib/use-learner-history";

interface MistakesReviewListProps {
  baseMistakeBundles: QuestionBundle[];
  allQuestionBundles: QuestionBundle[];
  totalMistakeCount: number;
}

export function MistakesReviewList({
  baseMistakeBundles,
  allQuestionBundles,
  totalMistakeCount
}: MistakesReviewListProps) {
  const { history, isLoaded } = useLearnerHistory();
  const mergedMistakeBundles = mergeMistakeBundlesWithHistory(baseMistakeBundles, allQuestionBundles, history);
  const visibleMistakeCount = totalMistakeCount + history.questionAttempts.filter((attempt) => !attempt.isCorrect).length;

  return (
    <section className="single-column-grid">
      <article className="surface-card focus-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Mistake Review</p>
            <h2>Focus on repair before you move on.</h2>
          </div>
          <span className="chip">{visibleMistakeCount} total misses</span>
        </div>

        <p className="small-copy">
          Review the weak items, then return to practice.
        </p>
        {!isLoaded ? <p className="small-copy">Loading saved local history...</p> : null}
      </article>

      {mergedMistakeBundles.map((bundle) => (
        <article key={bundle.question.id} className="surface-card focus-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Needs Review</p>
              <h2>{bundle.category.labelEn}</h2>
            </div>
            <span className="chip">Mistakes only</span>
          </div>

          <p className="question-stem">{bundle.question.englishStem}</p>
          <QuestionFigure question={bundle.question} size="compact" />
          <p className="small-copy">{bundle.explanation.bodyEn}</p>

          <div className="action-row">
            <Link className="primary-button link-button" href="/practice">
              Retry in Practice
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
