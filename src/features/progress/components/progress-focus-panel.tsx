"use client";

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

  return (
    <section className="single-column-grid">
      <article className="surface-card focus-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Next Focus</p>
            <h2>Improve the lowest category first.</h2>
          </div>
          <span className="chip">{totals.totalAttempts} total attempts</span>
        </div>

        <p className="small-copy">
          Start with the lowest category.
        </p>
        <p className="small-copy">
          Overall accuracy: {totals.overallAccuracyPercent}% · Latest mock:{" "}
          {visibleLatestMockScore !== undefined ? `${visibleLatestMockScore}%` : "n/a"}
        </p>
        {!isLoaded ? <p className="small-copy">Loading saved local history...</p> : null}
      </article>

      <article className="surface-card focus-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Category Progress</p>
            <h2>Where your score changes most</h2>
          </div>
        </div>

        <div className="stack-list">
          {mergedProgress.map((item) => (
            <div key={item.category.id} className="list-card">
              <div>
                <span>{item.category.labelEn}</span>
                <small>
                  {item.attempts} attempts · {item.needsReviewCount} item(s) need review
                </small>
              </div>
              <strong>{item.accuracyPercent}%</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
