import { loadContentDataset } from "@/lib/content-store";
import {
  buildDatasetOverview,
  getCategoryProgressSummaries,
  getHazardPredictionQuestionBundles,
  getLatestMockExam,
  getStandardExamQuestionBundles
} from "@/lib/sample-dataset";

export async function getMockExamViewModel() {
  const dataset = await loadContentDataset();
  const overview = buildDatasetOverview(dataset);
  const latestMockExam = getLatestMockExam(dataset);
  const categoryProgress = getCategoryProgressSummaries(dataset);
  const standardQuestionBundles = getStandardExamQuestionBundles(dataset);
  const hazardQuestionBundles = getHazardPredictionQuestionBundles(dataset);
  const standardQuestionCount = Math.min(90, standardQuestionBundles.length);
  const hazardQuestionCount = Math.min(5, hazardQuestionBundles.length);
  const possiblePoints = standardQuestionCount + hazardQuestionCount * 2;

  return {
    overview,
    latestMockExam,
    categoryProgress,
    standardQuestionBundles,
    hazardQuestionBundles,
    setup: {
      standardQuestionCount,
      hazardQuestionCount,
      totalQuestionCount: standardQuestionCount + hazardQuestionCount,
      possiblePoints,
      timeLimitMinutes: 50,
      passThresholdPercent: latestMockExam?.passThresholdPercent ?? 90
    }
  };
}
