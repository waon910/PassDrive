"use client";

import { useEffect, useState } from "react";
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

function truncateCopy(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

export function MistakesReviewList({
  baseMistakeBundles,
  allQuestionBundles,
  totalMistakeCount
}: MistakesReviewListProps) {
  const { history, isLoaded } = useLearnerHistory();
  const mergedMistakeBundles = mergeMistakeBundlesWithHistory(baseMistakeBundles, allQuestionBundles, history);
  const visibleMistakeCount = totalMistakeCount + history.questionAttempts.filter((attempt) => !attempt.isCorrect).length;
  const [sortMode, setSortMode] = useState<"recent" | "category">("recent");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(mergedMistakeBundles[0]?.question.id ?? null);
  const sortedMistakeBundles =
    sortMode === "category"
      ? [...mergedMistakeBundles].sort((left, right) => left.category.labelEn.localeCompare(right.category.labelEn))
      : mergedMistakeBundles;
  const activeBundle =
    sortedMistakeBundles.find((bundle) => bundle.question.id === activeQuestionId) ?? sortedMistakeBundles[0];
  const topReviewCategories = Object.values(
    sortedMistakeBundles.reduce<Record<string, { label: string; count: number }>>((summary, bundle) => {
      const key = bundle.category.id;
      const existing = summary[key];

      if (existing) {
        existing.count += 1;
        return summary;
      }

      summary[key] = { label: bundle.category.labelEn, count: 1 };
      return summary;
    }, {})
  )
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);

  useEffect(() => {
    if (!activeBundle) {
      setActiveQuestionId(null);
      return;
    }

    if (activeQuestionId !== activeBundle.question.id) {
      setActiveQuestionId(activeBundle.question.id);
    }
  }, [activeBundle, activeQuestionId]);

  return (
    <section className="single-column-grid">
      <section className="overview-layout">
        <article className="surface-card focus-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Mistake Review</p>
              <h2>Focus on repair before you move on.</h2>
            </div>
            <span className="chip">{visibleMistakeCount} total misses</span>
          </div>

          <p className="small-copy">Review the weak items, then return to practice.</p>
          {!isLoaded ? <p className="small-copy">Loading saved local history...</p> : null}

          <div className="home-highlight-row" aria-label="Mistake review summary">
            <span className="home-highlight-chip">{sortedMistakeBundles.length} item(s) ready to review</span>
            <span className="home-highlight-chip">{topReviewCategories.length} category group(s)</span>
          </div>

          <div className="mode-toggle" role="tablist" aria-label="Mistake order">
            <button
              className={sortMode === "recent" ? "mode-button active" : "mode-button"}
              type="button"
              onClick={() => setSortMode("recent")}
            >
              Latest first
            </button>
            <button
              className={sortMode === "category" ? "mode-button active" : "mode-button"}
              type="button"
              onClick={() => setSortMode("category")}
            >
              By category
            </button>
          </div>

          <div className="action-row">
            <Link className="primary-button link-button" href="/practice">
              Retry in Practice
            </Link>
            <Link className="secondary-button link-button" href="/progress">
              Open Progress
            </Link>
          </div>
        </article>

        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Repair Queue</p>
              <h2>Start where misses cluster.</h2>
            </div>
          </div>

          <div className="stack-list">
            {topReviewCategories.length > 0 ? (
              topReviewCategories.map((item) => (
                <div key={item.label} className="list-card">
                  <div>
                    <span>{item.label}</span>
                    <small>Review this category before the next mock.</small>
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))
            ) : (
              <p className="small-copy">No mistakes are currently queued.</p>
            )}
          </div>
        </article>
      </section>

      {activeBundle ? (
        <section className="review-browser-layout">
          <article className="surface-card focus-card">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Review List</p>
                <h2>Choose one mistake to inspect.</h2>
              </div>
              <span className="chip">{sortedMistakeBundles.length} item(s)</span>
            </div>

            <div className="review-card-grid">
              {sortedMistakeBundles.map((bundle) => (
                <button
                  key={bundle.question.id}
                  className={bundle.question.id === activeBundle.question.id ? "review-select-card active" : "review-select-card"}
                  type="button"
                  onClick={() => setActiveQuestionId(bundle.question.id)}
                >
                  <div className="chip-row">
                    <span className="chip">{bundle.category.labelEn}</span>
                    <span className="small-copy">Mistakes only</span>
                  </div>
                  <strong>{bundle.question.englishStem}</strong>
                  <p>{truncateCopy(bundle.explanation.bodyEn, 140)}</p>
                </button>
              ))}
            </div>
          </article>

          <article className="surface-card focus-card review-detail-card">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Selected Item</p>
                <h2>{activeBundle.category.labelEn}</h2>
              </div>
              <span className="chip">Mistakes only</span>
            </div>

            <p className="question-stem">{activeBundle.question.englishStem}</p>
            <QuestionFigure question={activeBundle.question} size="compact" />
            <div className="explanation-panel">
              <p>{activeBundle.explanation.bodyEn}</p>
            </div>

            <div className="action-row">
              <Link className="primary-button link-button" href="/practice">
                Retry in Practice
              </Link>
            </div>
          </article>
        </section>
      ) : (
        <article className="surface-card focus-card empty-state">
          <div className="panel-head">
            <div>
              <p className="eyebrow">All Clear</p>
              <h2>No mistakes are waiting right now.</h2>
            </div>
          </div>

          <p className="small-copy">Return to practice or take a mock exam when you want a fresh set.</p>
          <div className="action-row">
            <Link className="primary-button link-button" href="/practice">
              Start Practice
            </Link>
            <Link className="secondary-button link-button" href="/mock-exam">
              Open Mock Exam
            </Link>
          </div>
        </article>
      )}
    </section>
  );
}
