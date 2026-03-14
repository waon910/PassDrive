"use client";

import Link from "next/link";

import { QuestionFigure } from "@/components/question-figure";
import { formatQuestionTypeLabel } from "@/domain/content-rules";
import type { ExamSession, QuestionBundle, UserProgress } from "@/domain/content-types";
import { buildHistoryTotals, getLatestMockExamFromHistory, mergeCategoryProgressWithHistory } from "@/lib/learner-history-aggregates";
import type { CategoryProgressSummary } from "@/lib/sample-dataset";
import { useLearnerHistory } from "@/lib/use-learner-history";

interface HomeNextStepPanelProps {
  featuredQuestion?: QuestionBundle;
  latestMockExam?: ExamSession;
  overview: {
    publishedQuestionCount: number;
  };
  baseCategoryProgress: CategoryProgressSummary[];
  publishedQuestionBundles: QuestionBundle[];
  baseUserProgress: UserProgress[];
  totalAttempts: number;
  totalCorrect: number;
}

export function HomeNextStepPanel({
  featuredQuestion,
  latestMockExam,
  overview,
  baseCategoryProgress,
  publishedQuestionBundles,
  baseUserProgress,
  totalAttempts,
  totalCorrect
}: HomeNextStepPanelProps) {
  const { history } = useLearnerHistory();
  const mergedProgress = mergeCategoryProgressWithHistory(
    baseCategoryProgress,
    publishedQuestionBundles,
    baseUserProgress,
    history
  );
  const weakestCategory = [...mergedProgress].sort((left, right) => left.accuracyPercent - right.accuracyPercent)[0];
  const localLatestMockExam = getLatestMockExamFromHistory(history);
  const visibleLatestMockScore = localLatestMockExam?.scorePercent ?? latestMockExam?.scorePercent;
  const totals = buildHistoryTotals(totalAttempts, totalCorrect, history);
  const weakestCategories = [...mergedProgress]
    .sort((left, right) => left.accuracyPercent - right.accuracyPercent)
    .slice(0, 3);

  return (
    <section className="single-column-grid">
      <section className="overview-layout">
        <article className="surface-card focus-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Next Step</p>
              <h2>Start with one focused action.</h2>
            </div>
            {featuredQuestion ? (
              <span className="chip">{formatQuestionTypeLabel(featuredQuestion.question.questionType)}</span>
            ) : null}
          </div>

          {featuredQuestion ? (
            <>
              <p className="question-stem">{featuredQuestion.question.englishStem}</p>

              <div className="home-question-preview">
                <QuestionFigure question={featuredQuestion.question} size="compact" />
                <div className="compact-metrics">
                  <div className="compact-metric">
                    <span>Weakest area</span>
                    <strong>{weakestCategory?.category.labelEn ?? "n/a"}</strong>
                  </div>
                  <div className="compact-metric">
                    <span>Overall accuracy rate</span>
                    <strong>{totals.overallAccuracyPercent}%</strong>
                  </div>
                  <div className="compact-metric">
                    <span>Latest mock</span>
                    <strong>{visibleLatestMockScore !== undefined ? `${visibleLatestMockScore}%` : "n/a"}</strong>
                  </div>
                </div>
              </div>

              <p className="small-copy">
                {featuredQuestion.category.labelEn}
                {" · "}
                {overview.publishedQuestionCount} available question(s)
              </p>
            </>
          ) : (
            <p className="small-copy">No practice question is currently available.</p>
          )}

          <div className="action-row">
            <Link className="primary-button link-button" href="/practice">
              Start Practice
            </Link>
            <Link className="secondary-button link-button" href="/mock-exam">
              Open Mock Exam
            </Link>
          </div>

          <div className="home-highlight-row" aria-label="Quick highlights">
            <span className="home-highlight-chip">Weakest: {weakestCategory?.category.labelEn ?? "n/a"}</span>
            <span className="home-highlight-chip">{totals.totalAttempts} total attempts</span>
            <span className="home-highlight-chip">{overview.publishedQuestionCount} study items ready</span>
          </div>
        </article>

        <div className="overview-support-stack">
          <article className="surface-card">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Snapshot</p>
                <h2>See the study state at a glance.</h2>
              </div>
            </div>

            <div className="compact-metrics">
              <div className="compact-metric">
                <span>Questions ready</span>
                <strong>{overview.publishedQuestionCount}</strong>
              </div>
              <div className="compact-metric">
                <span>Latest mock score</span>
                <strong>{visibleLatestMockScore !== undefined ? `${visibleLatestMockScore}%` : "n/a"}</strong>
              </div>
              <div className="compact-metric">
                <span>Review items</span>
                <strong>{weakestCategories.reduce((total, item) => total + item.needsReviewCount, 0)}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      <article className="surface-card focus-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Weak Areas</p>
            <h2>These categories have the lowest accuracy rates right now.</h2>
          </div>
        </div>

        <div className="tile-grid">
          {weakestCategories.map((item) => (
            <div key={item.category.id} className="summary-tile">
              <span className="eyebrow">{item.category.labelEn}</span>
              <strong>{item.accuracyPercent}% accuracy</strong>
              <p className="small-copy">
                {item.attempts} attempt(s) · {item.needsReviewCount} item(s) still need review
              </p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
