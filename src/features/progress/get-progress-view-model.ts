import { getCategoryProgressSummaries, getLatestMockExam, loadSampleDataset } from "@/lib/sample-dataset";

export async function getProgressViewModel() {
  const dataset = await loadSampleDataset();
  const categoryProgress = getCategoryProgressSummaries(dataset);
  const latestMockExam = getLatestMockExam(dataset);
  const totalAttempts = dataset.userProgress.reduce((total, item) => total + item.attemptsTotal, 0);
  const totalCorrect = dataset.userProgress.reduce((total, item) => total + item.correctTotal, 0);

  return {
    categoryProgress,
    latestMockExam,
    totalAttempts,
    overallAccuracyPercent: totalAttempts === 0 ? 0 : Math.round((totalCorrect / totalAttempts) * 100)
  };
}
