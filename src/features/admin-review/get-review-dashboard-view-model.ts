import type { QuestionBundle } from "@/domain/content-types";
import { getReviewQueueStage, type ReviewQueueStage } from "@/domain/review-rules";
import { getContentStoreCapabilities, type ContentStoreCapabilities, loadContentDataset } from "@/lib/content-store";
import { getAllQuestionBundles } from "@/lib/sample-dataset";

export interface ReviewDashboardItem {
  bundle: QuestionBundle;
  stage: ReviewQueueStage;
}

export interface ReviewDashboardViewModel {
  items: ReviewDashboardItem[];
  contentStore: ContentStoreCapabilities;
  summary: {
    needsSourceReview: number;
    needsTranslationReview: number;
    needsExplanationReview: number;
    readyToPublish: number;
    published: number;
  };
}

const STAGE_ORDER: ReviewQueueStage[] = [
  "needs_source_review",
  "needs_translation_review",
  "needs_explanation_review",
  "ready_to_publish",
  "published"
];

export async function getReviewDashboardViewModel(): Promise<ReviewDashboardViewModel> {
  const dataset = await loadContentDataset();
  const items = getAllQuestionBundles(dataset)
    .map((bundle) => ({
      bundle,
      stage: getReviewQueueStage(bundle.question, bundle.sourceReference)
    }))
    .sort((left, right) => {
      const stageOrder = STAGE_ORDER.indexOf(left.stage) - STAGE_ORDER.indexOf(right.stage);
      if (stageOrder !== 0) {
        return stageOrder;
      }

      return right.bundle.question.updatedAt.localeCompare(left.bundle.question.updatedAt);
    });

  return {
    items,
    contentStore: getContentStoreCapabilities(),
    summary: {
      needsSourceReview: items.filter((item) => item.stage === "needs_source_review").length,
      needsTranslationReview: items.filter((item) => item.stage === "needs_translation_review").length,
      needsExplanationReview: items.filter((item) => item.stage === "needs_explanation_review").length,
      readyToPublish: items.filter((item) => item.stage === "ready_to_publish").length,
      published: items.filter((item) => item.stage === "published").length
    }
  };
}
