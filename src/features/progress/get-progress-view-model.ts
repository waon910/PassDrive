import { loadContentDataset } from "@/lib/content-store";
import { getCategoryProgressSummaries, getLatestMockExam, getPublishedQuestionBundles } from "@/lib/sample-dataset";

export async function getProgressViewModel() {
  const dataset = await loadContentDataset();
  const categoryProgress = getCategoryProgressSummaries(dataset);
  const latestMockExam = getLatestMockExam(dataset);
  const totalAttempts = dataset.userProgress.reduce((total, item) => total + item.attemptsTotal, 0);
  const totalCorrect = dataset.userProgress.reduce((total, item) => total + item.correctTotal, 0);

  return {
    categoryProgress,
    latestMockExam,
    publishedQuestionBundles: getPublishedQuestionBundles(dataset),
    baseUserProgress: dataset.userProgress,
    totalAttempts,
    totalCorrect,
    overallAccuracyPercent: totalAttempts === 0 ? 0 : Math.round((totalCorrect / totalAttempts) * 100)
  };
}
