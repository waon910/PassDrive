import {
  buildDatasetOverview,
  getCategoryProgressSummaries,
  getExamEligibleQuestionBundles,
  getLatestMockExam,
  loadSampleDataset
} from "@/lib/sample-dataset";

export async function getMockExamViewModel() {
  const dataset = await loadSampleDataset();
  const overview = buildDatasetOverview(dataset);
  const latestMockExam = getLatestMockExam(dataset);
  const categoryProgress = getCategoryProgressSummaries(dataset);
  const examQuestionBundles = getExamEligibleQuestionBundles(dataset);

  return {
    overview,
    latestMockExam,
    categoryProgress,
    examQuestionBundles,
    setup: {
      questionCount: examQuestionBundles.length,
      timeLimitMinutes: 20,
      passThresholdPercent: latestMockExam?.passThresholdPercent ?? 90
    }
  };
}
