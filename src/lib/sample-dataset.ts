import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  Category,
  DatasetOverview,
  ExamSession,
  Explanation,
  GlossaryTerm,
  Question,
  QuestionBundle,
  SampleQuestionDataset,
  SourceReference,
  Tag
} from "@/domain/content-types";

const DEFAULT_SAMPLE_DATASET_PATH = path.join(
  process.cwd(),
  "data",
  "samples",
  "mvp-sample-question-set.json"
);

const REQUIRED_COLLECTIONS: Array<keyof Omit<SampleQuestionDataset, "meta">> = [
  "sourceReferences",
  "contentVersions",
  "categories",
  "tags",
  "questions",
  "choices",
  "explanations",
  "questionTags",
  "userProgress",
  "examSessions",
  "examSessionAnswers",
  "glossaryTerms"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertIsDataset(value: unknown): asserts value is SampleQuestionDataset {
  if (!isRecord(value)) {
    throw new Error("Sample dataset must be an object.");
  }

  if (!isRecord(value.meta)) {
    throw new Error('Sample dataset must include a "meta" object.');
  }

  for (const key of REQUIRED_COLLECTIONS) {
    if (!Array.isArray(value[key])) {
      throw new Error(`Sample dataset field "${key}" must be an array.`);
    }
  }
}

export async function loadSampleDataset(
  datasetPath: string = DEFAULT_SAMPLE_DATASET_PATH
): Promise<SampleQuestionDataset> {
  const raw = await readFile(datasetPath, "utf8");
  const parsed: unknown = JSON.parse(raw);

  assertIsDataset(parsed);

  return parsed;
}

export function buildDatasetOverview(dataset: SampleQuestionDataset): DatasetOverview {
  return {
    datasetId: dataset.meta.datasetId,
    locale: dataset.meta.locale,
    generatedAt: dataset.meta.generatedAt,
    questionCount: dataset.questions.length,
    publishedQuestionCount: dataset.questions.filter((question) => question.status === "published").length,
    mockExamCount: dataset.examSessions.filter((session) => session.mode === "mock_exam").length,
    glossaryTermCount: dataset.glossaryTerms.length,
    categoryCount: dataset.categories.length
  };
}

function buildMap<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function getPublishedQuestionBundles(dataset: SampleQuestionDataset): QuestionBundle[] {
  return getQuestionBundles(dataset, (question) => question.status === "published");
}

export function getAllQuestionBundles(dataset: SampleQuestionDataset): QuestionBundle[] {
  return getQuestionBundles(dataset);
}

export function getQuestionBundleById(
  dataset: SampleQuestionDataset,
  questionId: Question["id"]
): QuestionBundle | undefined {
  return getAllQuestionBundles(dataset).find((bundle) => bundle.question.id === questionId);
}

function getQuestionBundles(
  dataset: SampleQuestionDataset,
  predicate?: (question: Question) => boolean
): QuestionBundle[] {
  const sourceMap = buildMap<SourceReference>(dataset.sourceReferences);
  const categoryMap = buildMap<Category>(dataset.categories);
  const explanationMap = buildMap<Explanation>(dataset.explanations);
  const tagMap = buildMap<Tag>(dataset.tags);
  const choicesByQuestionId = new Map<string, SampleQuestionDataset["choices"]>();
  const tagsByQuestionId = new Map<string, Tag[]>();

  for (const choice of dataset.choices) {
    const group = choicesByQuestionId.get(choice.questionId) ?? [];
    group.push(choice);
    choicesByQuestionId.set(choice.questionId, group);
  }

  for (const questionTag of dataset.questionTags) {
    const tag = tagMap.get(questionTag.tagId);
    if (!tag) {
      continue;
    }

    const group = tagsByQuestionId.get(questionTag.questionId) ?? [];
    group.push(tag);
    tagsByQuestionId.set(questionTag.questionId, group);
  }

  return dataset.questions
    .filter((question) => (predicate ? predicate(question) : true))
    .map((question) => {
      const sourceReference = sourceMap.get(question.sourceReferenceId);
      const category = categoryMap.get(question.mainCategoryId);
      const explanation = explanationMap.get(question.activeExplanationId);

      if (!sourceReference || !category || !explanation) {
        throw new Error(`Question bundle is incomplete for question ${question.id}.`);
      }

      return {
        question,
        sourceReference,
        category,
        choices: [...(choicesByQuestionId.get(question.id) ?? [])].sort(
          (left, right) => left.displayOrder - right.displayOrder
        ),
        explanation,
        tags: tagsByQuestionId.get(question.id) ?? []
      };
    });
}

export function getFeaturedQuestion(dataset: SampleQuestionDataset): QuestionBundle | undefined {
  return getPublishedQuestionBundles(dataset)[0];
}

export function getExamEligibleQuestionBundles(dataset: SampleQuestionDataset): QuestionBundle[] {
  return getPublishedQuestionBundles(dataset).filter((bundle) => bundle.question.isExamEligible);
}

export function getFeaturedMockExam(dataset: SampleQuestionDataset) {
  return dataset.examSessions.find((session) => session.mode === "mock_exam");
}

export function getFeaturedProgress(dataset: SampleQuestionDataset) {
  return dataset.userProgress[0];
}

export function getQuestionStats(dataset: SampleQuestionDataset, questionId: Question["id"]) {
  const attempts = dataset.examSessionAnswers.filter((answer) => answer.questionId === questionId);

  return {
    attempts: attempts.length,
    correct: attempts.filter((answer) => answer.isCorrect).length
  };
}

export interface CategoryProgressSummary {
  category: Category;
  questionCount: number;
  attempts: number;
  correct: number;
  accuracyPercent: number;
  needsReviewCount: number;
}

export function getCategoryProgressSummaries(dataset: SampleQuestionDataset): CategoryProgressSummary[] {
  return dataset.categories
    .filter((category) => category.isActive)
    .map((category) => {
      const categoryQuestions = dataset.questions.filter((question) => question.mainCategoryId === category.id);
      const progressEntries = dataset.userProgress.filter((progress) =>
        categoryQuestions.some((question) => question.id === progress.questionId)
      );
      const attempts = progressEntries.reduce((total, item) => total + item.attemptsTotal, 0);
      const correct = progressEntries.reduce((total, item) => total + item.correctTotal, 0);
      const needsReviewCount = progressEntries.filter((item) => item.incorrectTotal > 0).length;

      return {
        category,
        questionCount: categoryQuestions.length,
        attempts,
        correct,
        accuracyPercent: attempts === 0 ? 0 : Math.round((correct / attempts) * 100),
        needsReviewCount
      };
    })
    .sort((left, right) => left.category.displayOrder - right.category.displayOrder);
}

export function getLatestMockExam(dataset: SampleQuestionDataset): ExamSession | undefined {
  return [...dataset.examSessions]
    .filter((session) => session.mode === "mock_exam")
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];
}

export function getMistakeQuestionBundles(dataset: SampleQuestionDataset): QuestionBundle[] {
  const mistakeQuestionIds = new Set(
    dataset.userProgress.filter((progress) => progress.incorrectTotal > 0).map((progress) => progress.questionId)
  );

  return getPublishedQuestionBundles(dataset).filter((bundle) => mistakeQuestionIds.has(bundle.question.id));
}

export interface GlossaryTermWithCategory {
  term: GlossaryTerm;
  category?: Category;
  sourceReference?: SourceReference;
}

export function getGlossaryTermDetails(dataset: SampleQuestionDataset): GlossaryTermWithCategory[] {
  const categoryMap = buildMap<Category>(dataset.categories);
  const sourceMap = buildMap<SourceReference>(dataset.sourceReferences);

  return [...dataset.glossaryTerms]
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((term) => ({
      term,
      category: term.relatedCategoryId ? categoryMap.get(term.relatedCategoryId) : undefined,
      sourceReference: term.sourceReferenceId ? sourceMap.get(term.sourceReferenceId) : undefined
    }));
}
