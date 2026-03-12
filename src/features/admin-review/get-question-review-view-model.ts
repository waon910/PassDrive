import type { QuestionBundle } from "@/domain/content-types";
import { canQuestionBePublished } from "@/domain/content-rules";
import { getContentStoreCapabilities, type ContentStoreCapabilities, loadContentDataset } from "@/lib/content-store";
import { getQuestionBundleById } from "@/lib/sample-dataset";

export interface QuestionReviewViewModel {
  bundle: QuestionBundle;
  canPublish: boolean;
  contentStore: ContentStoreCapabilities;
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
    canPublish: canQuestionBePublished(bundle.question),
    contentStore: getContentStoreCapabilities()
  };
}
