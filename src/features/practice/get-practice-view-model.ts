import { loadContentDataset } from "@/lib/content-store";
import { getCategoryProgressSummaries, getMistakeQuestionBundles, getPublishedQuestionBundles } from "@/lib/sample-dataset";

export async function getPracticeViewModel() {
  const dataset = await loadContentDataset();
  const questionBundles = getPublishedQuestionBundles(dataset);
  const categoryProgress = getCategoryProgressSummaries(dataset);
  const mistakeQuestionBundles = getMistakeQuestionBundles(dataset);

  return {
    availableQuestionCount: questionBundles.length,
    categoryProgress,
    questionBundles,
    mistakeQuestionIds: mistakeQuestionBundles.map((bundle) => bundle.question.id)
  };
}
