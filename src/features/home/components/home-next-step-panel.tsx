"use client";

import Link from "next/link";

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

  return (
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
          <p className="small-copy">
            Weakest area: {weakestCategory?.category.labelEn ?? "n/a"}
            {" · "}
            Accuracy: {totals.overallAccuracyPercent}%
            {" · "}
            Latest mock: {visibleLatestMockScore !== undefined ? `${visibleLatestMockScore}%` : "n/a"}
          </p>
          <p className="small-copy">
            {featuredQuestion.category.labelEn}
            {" · "}
            {overview.publishedQuestionCount} published question(s)
          </p>
        </>
      ) : (
        <p className="small-copy">No published practice question is currently available.</p>
      )}

      <div className="action-row">
        <Link className="primary-button link-button" href="/practice">
          Start Practice
        </Link>
        <Link className="secondary-button link-button" href="/mock-exam">
          Open Mock Exam
        </Link>
      </div>

      <div className="stack-list simple-route-list">
        <Link className="list-link" href="/mistakes">
          <span>Review Mistakes</span>
        </Link>
        <Link className="list-link" href="/progress">
          <span>Check Progress</span>
        </Link>
        <Link className="list-link" href="/signs-terms">
          <span>Signs & Terms</span>
        </Link>
      </div>
    </article>
  );
}
