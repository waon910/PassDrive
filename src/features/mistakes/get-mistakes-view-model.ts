import { getMistakeQuestionBundles, loadSampleDataset } from "@/lib/sample-dataset";

export async function getMistakesViewModel() {
  const dataset = await loadSampleDataset();
  const mistakeBundles = getMistakeQuestionBundles(dataset);

  return {
    mistakeBundles,
    totalMistakeCount: dataset.userProgress.reduce((total, item) => total + item.incorrectTotal, 0)
  };
}
