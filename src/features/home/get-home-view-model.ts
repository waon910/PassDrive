import {
  buildDatasetOverview,
  getCategoryProgressSummaries,
  getFeaturedQuestion,
  getLatestMockExam,
  getPublishedQuestionBundles,
  loadSampleDataset
} from "@/lib/sample-dataset";

export async function getHomeViewModel() {
  const dataset = await loadSampleDataset();
  const overview = buildDatasetOverview(dataset);
  const featuredQuestion = getFeaturedQuestion(dataset);
  const latestMockExam = getLatestMockExam(dataset);
  const categoryProgress = getCategoryProgressSummaries(dataset);
  const totalAttempts = dataset.userProgress.reduce((total, item) => total + item.attemptsTotal, 0);
  const totalCorrect = dataset.userProgress.reduce((total, item) => total + item.correctTotal, 0);
  const weakestCategory = [...categoryProgress].sort((left, right) => left.accuracyPercent - right.accuracyPercent)[0];

  return {
    overview,
    baseUserProgress: dataset.userProgress,
    categoryProgress,
    featuredQuestion,
    latestMockExam,
    publishedQuestionBundles: getPublishedQuestionBundles(dataset),
    totalAttempts,
    totalCorrect,
    weakestCategory,
  };
}
