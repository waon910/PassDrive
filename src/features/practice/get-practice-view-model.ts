import { getCategoryProgressSummaries, getMistakeQuestionBundles, getPublishedQuestionBundles, loadSampleDataset } from "@/lib/sample-dataset";

export async function getPracticeViewModel() {
  const dataset = await loadSampleDataset();
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
