import type { Choice, Question, QuestionStatus, QuestionType } from "@/domain/content-types";

function getTrueFalseChoiceRank(choice: Choice) {
  if (choice.choiceKey === "T") {
    return 0;
  }

  if (choice.choiceKey === "F") {
    return 1;
  }

  const normalizedText = choice.englishText.trim().toLowerCase();

  if (normalizedText === "true") {
    return 0;
  }

  if (normalizedText === "false") {
    return 1;
  }

  return Number.MAX_SAFE_INTEGER;
}

export function isQuestionPublished(question: Question) {
  return question.status === "published";
}

export function canQuestionBePublished(question: Question) {
  return Boolean(question.activeExplanationId) && question.status !== "published";
}

export function formatQuestionTypeLabel(questionType: QuestionType) {
  if (questionType === "true_false") {
    return "True / False";
  }

  if (questionType === "hazard_prediction") {
    return "Hazard Prediction";
  }

  return "Single Choice";
}

export function formatQuestionStatusLabel(status: QuestionStatus) {
  return status === "published" ? "Published" : "Unpublished";
}

export function getOrderedChoices(question: Question, choices: Choice[]) {
  if (question.questionType !== "true_false") {
    return choices;
  }

  return [...choices].sort((left, right) => {
    const rankDifference = getTrueFalseChoiceRank(left) - getTrueFalseChoiceRank(right);

    if (rankDifference !== 0) {
      return rankDifference;
    }

    return left.displayOrder - right.displayOrder;
  });
}
