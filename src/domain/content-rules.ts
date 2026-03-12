import type { Question, QuestionType, ReviewStatus, RightsStatus, SourceReference } from "@/domain/content-types";

export function isQuestionPublished(question: Question) {
  return question.status === "published";
}

export function canQuestionBePublished(question: Question, sourceReference: SourceReference) {
  return (
    question.translationReviewStatus === "approved" &&
    question.explanationReviewStatus === "approved" &&
    Boolean(question.activeExplanationId) &&
    sourceReference.rightsStatus === "approved"
  );
}

export function formatQuestionTypeLabel(questionType: QuestionType) {
  return questionType === "true_false" ? "True / False" : "Single Choice";
}

export function formatReviewStatusLabel(reviewStatus: ReviewStatus) {
  switch (reviewStatus) {
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Changes requested";
    default:
      return "Pending";
  }
}

export function formatRightsStatusLabel(rightsStatus: RightsStatus) {
  switch (rightsStatus) {
    case "approved":
      return "Approved";
    case "review_required":
      return "Review required";
    case "rejected":
      return "Rejected";
    default:
      return "Unchecked";
  }
}
