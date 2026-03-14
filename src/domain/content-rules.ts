import type { Question, QuestionStatus, QuestionType } from "@/domain/content-types";

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
