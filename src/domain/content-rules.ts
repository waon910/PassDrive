import type { Question, QuestionStatus, QuestionType } from "@/domain/content-types";

export function isQuestionPublished(question: Question) {
  return question.status === "published";
}

export function canQuestionBePublished(question: Question) {
  return Boolean(question.activeExplanationId) && question.status !== "published";
}

export function formatQuestionTypeLabel(questionType: QuestionType) {
  return questionType === "true_false" ? "True / False" : "Single Choice";
}

export function formatQuestionStatusLabel(status: QuestionStatus) {
  return status === "published" ? "Published" : "Unpublished";
}
