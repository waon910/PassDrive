import {
  buildDatasetOverview,
  getCategoryProgressSummaries,
  getFeaturedProgress,
  getFeaturedQuestion,
  getLatestMockExam,
  getQuestionStats,
  loadSampleDataset
} from "@/lib/sample-dataset";

export async function getHomeViewModel() {
  const dataset = await loadSampleDataset();
  const overview = buildDatasetOverview(dataset);
  const featuredQuestion = getFeaturedQuestion(dataset);
  const featuredProgress = getFeaturedProgress(dataset);
  const latestMockExam = getLatestMockExam(dataset);
  const categoryProgress = getCategoryProgressSummaries(dataset);
  const weakestCategory = [...categoryProgress].sort((left, right) => left.accuracyPercent - right.accuracyPercent)[0];

  return {
    overview,
    featuredQuestion,
    featuredProgress,
    latestMockExam,
    weakestCategory,
    featuredStats: featuredQuestion ? getQuestionStats(dataset, featuredQuestion.question.id) : undefined
  };
}
