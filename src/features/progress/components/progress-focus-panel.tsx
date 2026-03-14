"use client";

import Link from "next/link";

import type { ExamSession, QuestionBundle, UserProgress } from "@/domain/content-types";
import { buildHistoryTotals, getLatestMockExamFromHistory, mergeCategoryProgressWithHistory } from "@/lib/learner-history-aggregates";
import type { CategoryProgressSummary } from "@/lib/sample-dataset";
import { useLearnerHistory } from "@/lib/use-learner-history";

interface ProgressFocusPanelProps {
  baseCategoryProgress: CategoryProgressSummary[];
  publishedQuestionBundles: QuestionBundle[];
  baseUserProgress: UserProgress[];
  latestMockExam?: ExamSession;
  totalAttempts: number;
  totalCorrect: number;
}

export function ProgressFocusPanel({
  baseCategoryProgress,
  publishedQuestionBundles,
  baseUserProgress,
  latestMockExam,
  totalAttempts,
  totalCorrect
}: ProgressFocusPanelProps) {
  const { history, isLoaded } = useLearnerHistory();
  const mergedProgress = mergeCategoryProgressWithHistory(
    baseCategoryProgress,
    publishedQuestionBundles,
    baseUserProgress,
    history
  );
  const totals = buildHistoryTotals(totalAttempts, totalCorrect, history);
  const localLatestMockExam = getLatestMockExamFromHistory(history);
  const visibleLatestMockScore = localLatestMockExam?.scorePercent ?? latestMockExam?.scorePercent;
  const sortedProgress = [...mergedProgress].sort((left, right) => left.accuracyPercent - right.accuracyPercent);
  const weakestCategory = sortedProgress[0];
  const focusCategories = sortedProgress.slice(0, 3);

  return (
    <section className="single-column-grid">
      <section className="overview-layout">
        <article className="surface-card focus-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Next Focus</p>
              <h2>Start with the category where your accuracy rate is lowest.</h2>
            </div>
            <span className="chip">{totals.totalAttempts} total attempts</span>
          </div>

          <p className="question-stem">{weakestCategory?.category.labelEn ?? "No progress data yet."}</p>
          <p className="small-copy support-note">
            Work on the category with the lowest accuracy rate before you switch back to a full mock exam.
          </p>

          {weakestCategory ? (
            <div className="compact-metrics">
              <div className="compact-metric">
                <span>Current accuracy rate</span>
                <strong>{weakestCategory.accuracyPercent}%</strong>
              </div>
              <div className="compact-metric">
                <span>Attempts</span>
                <strong>{weakestCategory.attempts}</strong>
              </div>
              <div className="compact-metric">
                <span>Needs review</span>
                <strong>{weakestCategory.needsReviewCount}</strong>
              </div>
            </div>
          ) : null}

          <div className="action-row">
            <Link className="primary-button link-button" href="/practice">
              Start Practice
            </Link>
            <Link className="secondary-button link-button" href="/mistakes">
              Review Mistakes
            </Link>
          </div>

          {!isLoaded ? <p className="small-copy">Loading saved local history...</p> : null}
        </article>

        <div className="overview-support-stack">
          <article className="surface-card">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Snapshot</p>
                <h2>Keep the core metrics visible.</h2>
              </div>
            </div>

            <div className="compact-metrics">
              <div className="compact-metric">
                <span>Overall accuracy rate</span>
                <strong>{totals.overallAccuracyPercent}%</strong>
              </div>
              <div className="compact-metric">
                <span>Latest mock</span>
                <strong>{visibleLatestMockScore !== undefined ? `${visibleLatestMockScore}%` : "n/a"}</strong>
              </div>
              <div className="compact-metric">
                <span>Categories tracked</span>
                <strong>{sortedProgress.length}</strong>
              </div>
            </div>
          </article>

          <article className="surface-card">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Priority Queue</p>
                <h2>Lowest accuracy rates first.</h2>
              </div>
            </div>

            <div className="stack-list">
              {focusCategories.map((item) => (
                <div key={item.category.id} className="list-card">
                  <div>
                    <span>{item.category.labelEn}</span>
                    <small>{item.needsReviewCount} item(s) need review</small>
                  </div>
                  <strong>{item.accuracyPercent}% accuracy</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <article className="surface-card focus-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Accuracy Rate by Category</p>
            <h2>Compare categories by your accuracy rate in each one.</h2>
          </div>
        </div>

        <div className="progress-category-grid">
          {sortedProgress.map((item) => (
            <article key={item.category.id} className="progress-category-card">
              <div className="progress-card-header">
                <span className="chip">{item.category.labelEn}</span>
                <strong>{item.accuracyPercent}% accuracy</strong>
              </div>
              <div className="progress-track" aria-hidden="true">
                <div className="progress-fill" style={{ width: `${item.accuracyPercent}%` }} />
              </div>
              <p>
                {item.attempts} attempt(s) · {item.needsReviewCount} item(s) still need review
              </p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
