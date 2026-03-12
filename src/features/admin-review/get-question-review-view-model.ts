import type { ExplanationReview, QuestionBundle, TranslationReview } from "@/domain/content-types";
import { canQuestionBePublished } from "@/domain/content-rules";
import { getReviewQueueStage } from "@/domain/review-rules";
import { getContentStoreCapabilities, type ContentStoreCapabilities, loadContentDataset } from "@/lib/content-store";
import { getQuestionBundleById } from "@/lib/sample-dataset";

export interface QuestionReviewViewModel {
  bundle: QuestionBundle;
  stage: ReturnType<typeof getReviewQueueStage>;
  canPublish: boolean;
  contentStore: ContentStoreCapabilities;
  translationReview?: TranslationReview;
  explanationReview?: ExplanationReview;
}

export async function getQuestionReviewViewModel(
  questionId: QuestionBundle["question"]["id"]
): Promise<QuestionReviewViewModel | undefined> {
  const dataset = await loadContentDataset();
  const bundle = getQuestionBundleById(dataset, questionId);

  if (!bundle) {
    return undefined;
  }

  return {
    bundle,
    stage: getReviewQueueStage(bundle.question, bundle.sourceReference),
    canPublish: canQuestionBePublished(bundle.question, bundle.sourceReference),
    contentStore: getContentStoreCapabilities(),
    translationReview: bundle.translationReview,
    explanationReview: bundle.explanationReview
  };
}
