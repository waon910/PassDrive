import {
  getCategoryProgressSummaries,
  getMistakeQuestionBundles,
  getPublishedQuestionBundles,
  getQuestionStats,
  loadSampleDataset
} from "@/lib/sample-dataset";

const PRACTICE_MODES = [
  {
    title: "Random Practice",
    description: "Run a lightweight mixed set to keep recall fresh.",
    value: "1 starter set"
  },
  {
    title: "By Category",
    description: "Target a weak topic before the next mock exam.",
    value: "1 active category"
  },
  {
    title: "Mistakes First",
    description: "Revisit only the items that previously caused errors.",
    value: "review-ready"
  }
];

export async function getPracticeViewModel() {
  const dataset = await loadSampleDataset();
  const questionBundles = getPublishedQuestionBundles(dataset);
  const featuredQuestion = questionBundles[0];
  const categoryProgress = getCategoryProgressSummaries(dataset);
  const mistakeQuestionBundles = getMistakeQuestionBundles(dataset);

  return {
    availableQuestionCount: questionBundles.length,
    categoryProgress,
    featuredQuestion,
    featuredStats: featuredQuestion ? getQuestionStats(dataset, featuredQuestion.question.id) : undefined,
    questionBundles,
    mistakeQuestionIds: mistakeQuestionBundles.map((bundle) => bundle.question.id),
    practiceModes: PRACTICE_MODES
  };
}
