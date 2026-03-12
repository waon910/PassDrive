import type { Question, SourceReference } from "@/domain/content-types";

export type ReviewQueueStage =
  | "needs_source_review"
  | "needs_translation_review"
  | "needs_explanation_review"
  | "ready_to_publish"
  | "published";

export function getReviewQueueStage(question: Question, sourceReference: SourceReference): ReviewQueueStage {
  if (question.status === "published") {
    return "published";
  }

  if (sourceReference.rightsStatus !== "approved") {
    return "needs_source_review";
  }

  if (question.translationReviewStatus !== "approved") {
    return "needs_translation_review";
  }

  if (question.explanationReviewStatus !== "approved") {
    return "needs_explanation_review";
  }

  return "ready_to_publish";
}

export function formatReviewQueueStageLabel(stage: ReviewQueueStage) {
  switch (stage) {
    case "needs_source_review":
      return "Needs source review";
    case "needs_translation_review":
      return "Needs translation review";
    case "needs_explanation_review":
      return "Needs explanation review";
    case "ready_to_publish":
      return "Ready to publish";
    case "published":
      return "Published";
  }
}
