import type { ExplanationReview, QuestionBundle, TranslationReview } from "@/domain/content-types";
import { canQuestionBePublished } from "@/domain/content-rules";
import { getReviewQueueStage } from "@/domain/review-rules";
import { getQuestionBundleById, loadSampleDataset } from "@/lib/sample-dataset";

export interface QuestionReviewViewModel {
  bundle: QuestionBundle;
  stage: ReturnType<typeof getReviewQueueStage>;
  canPublish: boolean;
  translationReview?: TranslationReview;
  explanationReview?: ExplanationReview;
}

export async function getQuestionReviewViewModel(
  questionId: QuestionBundle["question"]["id"]
): Promise<QuestionReviewViewModel | undefined> {
  const dataset = await loadSampleDataset();
  const bundle = getQuestionBundleById(dataset, questionId);

  if (!bundle) {
    return undefined;
  }

  return {
    bundle,
    stage: getReviewQueueStage(bundle.question, bundle.sourceReference),
    canPublish: canQuestionBePublished(bundle.question, bundle.sourceReference),
    translationReview: bundle.translationReview,
    explanationReview: bundle.explanationReview
  };
}
