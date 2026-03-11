import type { QuestionBundle } from "@/domain/content-types";

export interface SessionAnswerMap {
  [questionId: string]: string | undefined;
}

export interface SessionCategoryBreakdown {
  categoryId: string;
  categoryLabel: string;
  total: number;
  correct: number;
  accuracyPercent: number;
}

export interface SessionSummary {
  totalQuestions: number;
  answeredQuestions: number;
  unansweredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercent: number;
  passed: boolean;
  categoryBreakdown: SessionCategoryBreakdown[];
}

export function isChoiceCorrect(bundle: QuestionBundle, selectedChoiceKey?: string) {
  if (!selectedChoiceKey) {
    return false;
  }

  return bundle.choices.some((choice) => choice.choiceKey === selectedChoiceKey && choice.isCorrect);
}

export function buildSessionSummary(
  bundles: QuestionBundle[],
  answers: SessionAnswerMap,
  passThresholdPercent: number
): SessionSummary {
  const categoryMap = new Map<
    string,
    {
      categoryId: string;
      categoryLabel: string;
      total: number;
      correct: number;
    }
  >();

  let answeredQuestions = 0;
  let correctAnswers = 0;

  for (const bundle of bundles) {
    const selectedChoiceKey = answers[bundle.question.id];
    const didAnswer = typeof selectedChoiceKey === "string";
    const correct = isChoiceCorrect(bundle, selectedChoiceKey);

    if (didAnswer) {
      answeredQuestions += 1;
    }

    if (correct) {
      correctAnswers += 1;
    }

    const current = categoryMap.get(bundle.category.id) ?? {
      categoryId: bundle.category.id,
      categoryLabel: bundle.category.labelEn,
      total: 0,
      correct: 0
    };

    current.total += 1;
    current.correct += correct ? 1 : 0;
    categoryMap.set(bundle.category.id, current);
  }

  const totalQuestions = bundles.length;
  const unansweredQuestions = totalQuestions - answeredQuestions;
  const incorrectAnswers = answeredQuestions - correctAnswers;
  const scorePercent = totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100);

  return {
    totalQuestions,
    answeredQuestions,
    unansweredQuestions,
    correctAnswers,
    incorrectAnswers,
    scorePercent,
    passed: scorePercent >= passThresholdPercent,
    categoryBreakdown: [...categoryMap.values()].map((item) => ({
      ...item,
      accuracyPercent: item.total === 0 ? 0 : Math.round((item.correct / item.total) * 100)
    }))
  };
}
