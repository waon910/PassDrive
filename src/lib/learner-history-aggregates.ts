import type { QuestionBundle, UserProgress } from "@/domain/content-types";
import type { LearnerHistorySnapshot, StoredMockExamRun, StoredQuestionAttempt } from "@/domain/learner-history-types";
import type { CategoryProgressSummary } from "@/lib/sample-dataset";

interface QuestionHistoryTotals {
  attemptsTotal: number;
  correctTotal: number;
  incorrectTotal: number;
}

function buildQuestionHistoryTotals(questionAttempts: StoredQuestionAttempt[]) {
  const totals = new Map<string, QuestionHistoryTotals>();

  for (const attempt of questionAttempts) {
    const current = totals.get(attempt.questionId) ?? {
      attemptsTotal: 0,
      correctTotal: 0,
      incorrectTotal: 0
    };

    current.attemptsTotal += 1;
    current.correctTotal += attempt.isCorrect ? 1 : 0;
    current.incorrectTotal += attempt.isCorrect ? 0 : 1;
    totals.set(attempt.questionId, current);
  }

  return totals;
}

export function mergeCategoryProgressWithHistory(
  baseProgress: CategoryProgressSummary[],
  questionBundles: QuestionBundle[],
  baseUserProgress: UserProgress[],
  history: LearnerHistorySnapshot
) {
  const categoryQuestionIds = new Map<string, Set<string>>();
  const questionTotals = buildQuestionHistoryTotals(history.questionAttempts);
  const baseProgressByQuestionId = new Map(baseUserProgress.map((item) => [item.questionId, item]));

  for (const bundle of questionBundles) {
    const current = categoryQuestionIds.get(bundle.category.id) ?? new Set<string>();
    current.add(bundle.question.id);
    categoryQuestionIds.set(bundle.category.id, current);
  }

  return baseProgress.map((item) => {
    const questionIds = categoryQuestionIds.get(item.category.id) ?? new Set<string>();
    let attempts = item.attempts;
    let correct = item.correct;
    let needsReviewCount = 0;

    for (const questionId of questionIds) {
      const baseQuestionProgress = baseProgressByQuestionId.get(questionId);
      const totals = questionTotals.get(questionId);

      if (baseQuestionProgress) {
        if (baseQuestionProgress.incorrectTotal > 0) {
          needsReviewCount += 1;
        }
      }

      if (totals) {
        attempts += totals.attemptsTotal;
        correct += totals.correctTotal;
      }

      const baseIncorrectTotal = baseQuestionProgress?.incorrectTotal ?? 0;
      const localIncorrectTotal = totals?.incorrectTotal ?? 0;

      if (baseIncorrectTotal === 0 && localIncorrectTotal > 0) {
        needsReviewCount += 1;
      }
    }

    return {
      ...item,
      attempts,
      correct,
      needsReviewCount,
      accuracyPercent: attempts === 0 ? 0 : Math.round((correct / attempts) * 100)
    };
  });
}

export function mergeMistakeBundlesWithHistory(
  baseMistakeBundles: QuestionBundle[],
  allQuestionBundles: QuestionBundle[],
  history: LearnerHistorySnapshot
) {
  const mistakeIds = new Set(baseMistakeBundles.map((bundle) => bundle.question.id));

  for (const attempt of history.questionAttempts) {
    if (!attempt.isCorrect) {
      mistakeIds.add(attempt.questionId);
    }
  }

  return allQuestionBundles.filter((bundle) => mistakeIds.has(bundle.question.id));
}

export function buildHistoryTotals(baseTotalAttempts: number, baseTotalCorrect: number, history: LearnerHistorySnapshot) {
  const localAttempts = history.questionAttempts.length;
  const localCorrect = history.questionAttempts.filter((attempt) => attempt.isCorrect).length;
  const totalAttempts = baseTotalAttempts + localAttempts;
  const totalCorrect = baseTotalCorrect + localCorrect;

  return {
    totalAttempts,
    totalCorrect,
    overallAccuracyPercent: totalAttempts === 0 ? 0 : Math.round((totalCorrect / totalAttempts) * 100)
  };
}

export function getLatestMockExamFromHistory(history: LearnerHistorySnapshot): StoredMockExamRun | undefined {
  return [...history.mockExamRuns].sort((left, right) => right.completedAt.localeCompare(left.completedAt))[0];
}
