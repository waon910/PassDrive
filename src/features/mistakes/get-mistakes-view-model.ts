import { loadContentDataset } from "@/lib/content-store";
import { getMistakeQuestionBundles, getPublishedQuestionBundles } from "@/lib/sample-dataset";

export async function getMistakesViewModel() {
  const dataset = await loadContentDataset();
  const mistakeBundles = getMistakeQuestionBundles(dataset);

  return {
    allQuestionBundles: getPublishedQuestionBundles(dataset),
    mistakeBundles,
    totalMistakeCount: dataset.userProgress.reduce((total, item) => total + item.incorrectTotal, 0)
  };
}
