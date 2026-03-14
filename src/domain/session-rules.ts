import type { PromptChoiceKey, QuestionBundle } from "@/domain/content-types";

export interface SingleChoiceQuestionResponse {
  kind: "single_choice";
  selectedChoiceKey: string;
}

export interface HazardPredictionQuestionResponse {
  kind: "hazard_prediction";
  promptChoiceKeys: Record<string, PromptChoiceKey | undefined>;
}

export type SessionQuestionResponse = SingleChoiceQuestionResponse | HazardPredictionQuestionResponse;

export interface SessionAnswerMap {
  [questionId: string]: SessionQuestionResponse | undefined;
}

export interface SessionCategoryBreakdown {
  categoryId: string;
  categoryLabel: string;
  total: number;
  correct: number;
  earnedPoints: number;
  possiblePoints: number;
  accuracyPercent: number;
}

export interface SessionSummary {
  totalQuestions: number;
  answeredQuestions: number;
  unansweredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  earnedPoints: number;
  possiblePoints: number;
  scorePercent: number;
  passThresholdPoints: number;
  passed: boolean;
  categoryBreakdown: SessionCategoryBreakdown[];
}

function isSingleChoiceResponse(response: SessionQuestionResponse | undefined): response is SingleChoiceQuestionResponse {
  return response?.kind === "single_choice" && typeof response.selectedChoiceKey === "string";
}

function isHazardPredictionResponse(
  response: SessionQuestionResponse | undefined
): response is HazardPredictionQuestionResponse {
  return response?.kind === "hazard_prediction" && typeof response.promptChoiceKeys === "object";
}

export function getQuestionPointValue(bundle: QuestionBundle) {
  return bundle.question.pointValue ?? (bundle.question.questionType === "hazard_prediction" ? 2 : 1);
}

export function getQuestionPromptCount(bundle: QuestionBundle) {
  return bundle.question.questionType === "hazard_prediction" ? bundle.questionPrompts.length : bundle.choices.length;
}

export function isResponseComplete(bundle: QuestionBundle, response?: SessionQuestionResponse) {
  if (bundle.question.questionType === "hazard_prediction") {
    if (!isHazardPredictionResponse(response)) {
      return false;
    }

    return bundle.questionPrompts.every((prompt) => {
      const choiceKey = response.promptChoiceKeys[prompt.promptKey];
      return choiceKey === "T" || choiceKey === "F";
    });
  }

  return isSingleChoiceResponse(response);
}

export function isChoiceCorrect(bundle: QuestionBundle, selectedChoiceKey?: string) {
  if (!selectedChoiceKey) {
    return false;
  }

  return bundle.choices.some((choice) => choice.choiceKey === selectedChoiceKey && choice.isCorrect);
}

export function isQuestionCorrect(bundle: QuestionBundle, response?: SessionQuestionResponse) {
  if (!isResponseComplete(bundle, response)) {
    return false;
  }

  if (bundle.question.questionType === "hazard_prediction") {
    if (!isHazardPredictionResponse(response)) {
      return false;
    }

    return bundle.questionPrompts.every(
      (prompt) => response.promptChoiceKeys[prompt.promptKey] === prompt.correctChoiceKey
    );
  }

  if (!isSingleChoiceResponse(response)) {
    return false;
  }

  return isChoiceCorrect(bundle, response.selectedChoiceKey);
}

export function buildResponseStorageValue(response: SessionQuestionResponse) {
  if (response.kind === "single_choice") {
    return response.selectedChoiceKey;
  }

  return Object.entries(response.promptChoiceKeys)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([promptKey, choiceKey]) => `${promptKey}:${choiceKey ?? "-"}`)
    .join("|");
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
      earnedPoints: number;
      possiblePoints: number;
    }
  >();

  let answeredQuestions = 0;
  let correctAnswers = 0;
  let earnedPoints = 0;
  let possiblePoints = 0;

  for (const bundle of bundles) {
    const response = answers[bundle.question.id];
    const didAnswer = isResponseComplete(bundle, response);
    const correct = isQuestionCorrect(bundle, response);
    const pointValue = getQuestionPointValue(bundle);

    if (didAnswer) {
      answeredQuestions += 1;
    }

    if (correct) {
      correctAnswers += 1;
      earnedPoints += pointValue;
    }

    possiblePoints += pointValue;

    const current = categoryMap.get(bundle.category.id) ?? {
      categoryId: bundle.category.id,
      categoryLabel: bundle.category.labelEn,
      total: 0,
      correct: 0,
      earnedPoints: 0,
      possiblePoints: 0
    };

    current.total += 1;
    current.correct += correct ? 1 : 0;
    current.earnedPoints += correct ? pointValue : 0;
    current.possiblePoints += pointValue;
    categoryMap.set(bundle.category.id, current);
  }

  const totalQuestions = bundles.length;
  const unansweredQuestions = totalQuestions - answeredQuestions;
  const incorrectAnswers = answeredQuestions - correctAnswers;
  const scorePercent = possiblePoints === 0 ? 0 : Math.round((earnedPoints / possiblePoints) * 100);
  const passThresholdPoints = Math.ceil((possiblePoints * passThresholdPercent) / 100);

  return {
    totalQuestions,
    answeredQuestions,
    unansweredQuestions,
    correctAnswers,
    incorrectAnswers,
    earnedPoints,
    possiblePoints,
    scorePercent,
    passThresholdPoints,
    passed: scorePercent >= passThresholdPercent,
    categoryBreakdown: [...categoryMap.values()].map((item) => ({
      ...item,
      accuracyPercent: item.possiblePoints === 0 ? 0 : Math.round((item.earnedPoints / item.possiblePoints) * 100)
    }))
  };
}
