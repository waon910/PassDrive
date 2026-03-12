import path from "node:path";
import { mkdir } from "node:fs/promises";

import { knex, type Knex } from "knex";

import type {
  Category,
  Choice,
  ContentVersion,
  ExamSession,
  ExamSessionAnswer,
  Explanation,
  ExplanationReview,
  GlossaryTerm,
  Question,
  QuestionTag,
  SampleQuestionDataset,
  SampleDatasetMeta,
  SourceReference,
  Tag,
  TranslationReview,
  UserProgress
} from "@/domain/content-types";
import { getContentDatabaseUrl, shouldAutoSeedContentDatabase, type ContentStoreMode } from "@/lib/content-store-config";
import { loadSampleDataset } from "@/lib/sample-dataset";

const TABLES = {
  datasetMeta: "dataset_meta",
  sourceReferences: "source_references",
  contentVersions: "content_versions",
  categories: "categories",
  tags: "tags",
  questions: "questions",
  choices: "choices",
  explanations: "explanations",
  translationReviews: "translation_reviews",
  explanationReviews: "explanation_reviews",
  questionTags: "question_tags",
  userProgress: "user_progress",
  examSessions: "exam_sessions",
  examSessionAnswers: "exam_session_answers",
  glossaryTerms: "glossary_terms"
} as const;

const DELETE_ORDER = [
  TABLES.examSessionAnswers,
  TABLES.examSessions,
  TABLES.userProgress,
  TABLES.questionTags,
  TABLES.explanationReviews,
  TABLES.translationReviews,
  TABLES.explanations,
  TABLES.choices,
  TABLES.questions,
  TABLES.glossaryTerms,
  TABLES.tags,
  TABLES.categories,
  TABLES.contentVersions,
  TABLES.sourceReferences,
  TABLES.datasetMeta
] as const;

type RelationalContentStoreMode = Exclude<ContentStoreMode, "file">;

declare global {
  // eslint-disable-next-line no-var
  var __passdriveContentDb: Promise<Knex> | undefined;
  // eslint-disable-next-line no-var
  var __passdriveContentDbReady: Promise<void> | undefined;
}

function toOptionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === "1";
}

function normalizeMeta(row: Record<string, unknown>): SampleDatasetMeta {
  return {
    datasetId: String(row.datasetId),
    datasetType: String(row.datasetType),
    locale: String(row.locale),
    notes: String(row.notes),
    generatedAt: String(row.generatedAt)
  };
}

function normalizeSourceReference(row: Record<string, unknown>): SourceReference {
  return {
    id: String(row.id),
    sourceName: String(row.sourceName),
    sourceType: row.sourceType as SourceReference["sourceType"],
    sourceUrl: toOptionalString(row.sourceUrl),
    publisher: toOptionalString(row.publisher),
    regionScope: row.regionScope as SourceReference["regionScope"],
    originalLanguage: row.originalLanguage as SourceReference["originalLanguage"],
    fetchedAt: String(row.fetchedAt),
    snapshotPath: toOptionalString(row.snapshotPath),
    rightsStatus: row.rightsStatus as SourceReference["rightsStatus"],
    rightsNotes: toOptionalString(row.rightsNotes),
    lastVerifiedAt: toOptionalString(row.lastVerifiedAt),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt)
  };
}

function normalizeContentVersion(row: Record<string, unknown>): ContentVersion {
  return {
    id: String(row.id),
    label: String(row.label),
    status: row.status as ContentVersion["status"],
    effectiveFrom: String(row.effectiveFrom),
    effectiveTo: toOptionalString(row.effectiveTo),
    releaseNotes: toOptionalString(row.releaseNotes),
    createdAt: String(row.createdAt)
  };
}

function normalizeCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    slug: String(row.slug),
    labelEn: String(row.labelEn),
    descriptionEn: toOptionalString(row.descriptionEn),
    displayOrder: Number(row.displayOrder),
    isActive: toBoolean(row.isActive)
  };
}

function normalizeTag(row: Record<string, unknown>): Tag {
  return {
    id: String(row.id),
    slug: String(row.slug),
    labelEn: String(row.labelEn)
  };
}

function normalizeQuestion(row: Record<string, unknown>): Question {
  return {
    id: String(row.id),
    sourceReferenceId: String(row.sourceReferenceId),
    contentVersionId: String(row.contentVersionId),
    sourceQuestionRef: toOptionalString(row.sourceQuestionRef),
    questionType: row.questionType as Question["questionType"],
    mainCategoryId: String(row.mainCategoryId),
    difficulty: row.difficulty as Question["difficulty"],
    status: row.status as Question["status"],
    originalStem: String(row.originalStem),
    originalLanguage: row.originalLanguage as Question["originalLanguage"],
    englishStem: String(row.englishStem),
    correctChoiceKey: String(row.correctChoiceKey),
    hasImage: toBoolean(row.hasImage),
    imageAssetPath: toOptionalString(row.imageAssetPath),
    imageAltTextEn: toOptionalString(row.imageAltTextEn),
    imageCaptionEn: toOptionalString(row.imageCaptionEn),
    explanationOrigin: row.explanationOrigin as Question["explanationOrigin"],
    activeExplanationId: String(row.activeExplanationId),
    translationReviewStatus: row.translationReviewStatus as Question["translationReviewStatus"],
    explanationReviewStatus: row.explanationReviewStatus as Question["explanationReviewStatus"],
    isExamEligible: toBoolean(row.isExamEligible),
    publishedAt: toOptionalString(row.publishedAt),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt)
  };
}

function normalizeChoice(row: Record<string, unknown>): Choice {
  return {
    id: String(row.id),
    questionId: String(row.questionId),
    choiceKey: String(row.choiceKey),
    displayOrder: Number(row.displayOrder),
    originalText: toOptionalString(row.originalText),
    englishText: String(row.englishText),
    isCorrect: toBoolean(row.isCorrect)
  };
}

function normalizeExplanation(row: Record<string, unknown>): Explanation {
  return {
    id: String(row.id),
    questionId: String(row.questionId),
    origin: row.origin as Explanation["origin"],
    bodyEn: String(row.bodyEn),
    sourceDerived: toBoolean(row.sourceDerived),
    aiModel: toOptionalString(row.aiModel),
    aiPromptVersion: toOptionalString(row.aiPromptVersion),
    createdBy: String(row.createdBy),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt)
  };
}

function normalizeTranslationReview(row: Record<string, unknown>): TranslationReview {
  return {
    id: String(row.id),
    questionId: String(row.questionId),
    reviewer: String(row.reviewer),
    status: row.status as TranslationReview["status"],
    accuracyCheck: toBoolean(row.accuracyCheck),
    naturalnessCheck: toBoolean(row.naturalnessCheck),
    notes: toOptionalString(row.notes),
    reviewedAt: toOptionalString(row.reviewedAt)
  };
}

function normalizeExplanationReview(row: Record<string, unknown>): ExplanationReview {
  return {
    id: String(row.id),
    explanationId: String(row.explanationId),
    reviewer: String(row.reviewer),
    status: row.status as ExplanationReview["status"],
    accuracyCheck: toBoolean(row.accuracyCheck),
    clarityCheck: toBoolean(row.clarityCheck),
    notes: toOptionalString(row.notes),
    reviewedAt: toOptionalString(row.reviewedAt)
  };
}

function normalizeQuestionTag(row: Record<string, unknown>): QuestionTag {
  return {
    questionId: String(row.questionId),
    tagId: String(row.tagId)
  };
}

function normalizeUserProgress(row: Record<string, unknown>): UserProgress {
  return {
    learnerId: String(row.learnerId),
    questionId: String(row.questionId),
    attemptsTotal: Number(row.attemptsTotal),
    correctTotal: Number(row.correctTotal),
    incorrectTotal: Number(row.incorrectTotal),
    lastAnsweredAt: String(row.lastAnsweredAt),
    firstAnsweredAt: String(row.firstAnsweredAt),
    masteryLevel: row.masteryLevel as UserProgress["masteryLevel"],
    lastResult: row.lastResult as UserProgress["lastResult"]
  };
}

function normalizeExamSession(row: Record<string, unknown>): ExamSession {
  return {
    id: String(row.id),
    learnerId: String(row.learnerId),
    mode: row.mode as ExamSession["mode"],
    contentVersionId: String(row.contentVersionId),
    startedAt: String(row.startedAt),
    endedAt: toOptionalString(row.endedAt),
    timeLimitSeconds: row.timeLimitSeconds === null || row.timeLimitSeconds === undefined ? undefined : Number(row.timeLimitSeconds),
    questionCount: Number(row.questionCount),
    correctCount: row.correctCount === null || row.correctCount === undefined ? undefined : Number(row.correctCount),
    scorePercent: row.scorePercent === null || row.scorePercent === undefined ? undefined : Number(row.scorePercent),
    passThresholdPercent:
      row.passThresholdPercent === null || row.passThresholdPercent === undefined ? undefined : Number(row.passThresholdPercent),
    result: row.result as ExamSession["result"]
  };
}

function normalizeExamSessionAnswer(row: Record<string, unknown>): ExamSessionAnswer {
  return {
    id: String(row.id),
    examSessionId: String(row.examSessionId),
    questionId: String(row.questionId),
    selectedChoiceKey: String(row.selectedChoiceKey),
    isCorrect: toBoolean(row.isCorrect),
    answeredAt: String(row.answeredAt),
    responseTimeMs: row.responseTimeMs === null || row.responseTimeMs === undefined ? undefined : Number(row.responseTimeMs)
  };
}

function normalizeGlossaryTerm(row: Record<string, unknown>): GlossaryTerm {
  return {
    id: String(row.id),
    termEn: String(row.termEn),
    shortDefinitionEn: String(row.shortDefinitionEn),
    longExplanationEn: toOptionalString(row.longExplanationEn),
    relatedCategoryId: toOptionalString(row.relatedCategoryId),
    imageAssetPath: toOptionalString(row.imageAssetPath),
    isTrafficSign: toBoolean(row.isTrafficSign),
    displayOrder: Number(row.displayOrder)
  };
}

function getSqliteFilename() {
  const configured = getContentDatabaseUrl("sqlite");
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

async function createKnexInstance(mode: RelationalContentStoreMode) {
  if (mode === "sqlite") {
    const filename = getSqliteFilename();
    await mkdir(path.dirname(filename), { recursive: true });

    return knex({
      client: "sqlite3",
      connection: {
        filename
      },
      useNullAsDefault: true
    });
  }

  return knex({
    client: "pg",
    connection: getContentDatabaseUrl("postgres"),
    pool: {
      min: 0,
      max: 4
    }
  });
}

async function ensureTable(db: Knex, tableName: string, build: (table: Knex.CreateTableBuilder) => void) {
  const exists = await db.schema.hasTable(tableName);

  if (!exists) {
    await db.schema.createTable(tableName, build);
  }
}

async function ensureSchema(db: Knex) {
  await ensureTable(db, TABLES.datasetMeta, (table) => {
    table.string("datasetId").primary();
    table.string("datasetType").notNullable();
    table.string("locale").notNullable();
    table.text("notes").notNullable();
    table.string("generatedAt").notNullable();
  });

  await ensureTable(db, TABLES.sourceReferences, (table) => {
    table.string("id").primary();
    table.string("sourceName").notNullable();
    table.string("sourceType").notNullable();
    table.text("sourceUrl");
    table.text("publisher");
    table.string("regionScope").notNullable();
    table.string("originalLanguage").notNullable();
    table.string("fetchedAt").notNullable();
    table.text("snapshotPath");
    table.string("rightsStatus").notNullable();
    table.text("rightsNotes");
    table.string("lastVerifiedAt");
    table.string("createdAt").notNullable();
    table.string("updatedAt").notNullable();
  });

  await ensureTable(db, TABLES.contentVersions, (table) => {
    table.string("id").primary();
    table.string("label").notNullable();
    table.string("status").notNullable();
    table.string("effectiveFrom").notNullable();
    table.string("effectiveTo");
    table.text("releaseNotes");
    table.string("createdAt").notNullable();
  });

  await ensureTable(db, TABLES.categories, (table) => {
    table.string("id").primary();
    table.string("slug").notNullable();
    table.string("labelEn").notNullable();
    table.text("descriptionEn");
    table.integer("displayOrder").notNullable();
    table.boolean("isActive").notNullable();
  });

  await ensureTable(db, TABLES.tags, (table) => {
    table.string("id").primary();
    table.string("slug").notNullable();
    table.string("labelEn").notNullable();
  });

  await ensureTable(db, TABLES.questions, (table) => {
    table.string("id").primary();
    table.string("sourceReferenceId").notNullable();
    table.string("contentVersionId").notNullable();
    table.string("sourceQuestionRef");
    table.string("questionType").notNullable();
    table.string("mainCategoryId").notNullable();
    table.string("difficulty").notNullable();
    table.string("status").notNullable();
    table.text("originalStem").notNullable();
    table.string("originalLanguage").notNullable();
    table.text("englishStem").notNullable();
    table.string("correctChoiceKey").notNullable();
    table.boolean("hasImage").notNullable();
    table.text("imageAssetPath");
    table.text("imageAltTextEn");
    table.text("imageCaptionEn");
    table.string("explanationOrigin").notNullable();
    table.string("activeExplanationId").notNullable();
    table.string("translationReviewStatus").notNullable();
    table.string("explanationReviewStatus").notNullable();
    table.boolean("isExamEligible").notNullable();
    table.string("publishedAt");
    table.string("createdAt").notNullable();
    table.string("updatedAt").notNullable();
    table.index(["status"]);
    table.index(["mainCategoryId"]);
  });

  await ensureTable(db, TABLES.choices, (table) => {
    table.string("id").primary();
    table.string("questionId").notNullable();
    table.string("choiceKey").notNullable();
    table.integer("displayOrder").notNullable();
    table.text("originalText");
    table.text("englishText").notNullable();
    table.boolean("isCorrect").notNullable();
    table.index(["questionId"]);
  });

  await ensureTable(db, TABLES.explanations, (table) => {
    table.string("id").primary();
    table.string("questionId").notNullable();
    table.string("origin").notNullable();
    table.text("bodyEn").notNullable();
    table.boolean("sourceDerived").notNullable();
    table.string("aiModel");
    table.string("aiPromptVersion");
    table.string("createdBy").notNullable();
    table.string("createdAt").notNullable();
    table.string("updatedAt").notNullable();
    table.index(["questionId"]);
  });

  await ensureTable(db, TABLES.translationReviews, (table) => {
    table.string("id").primary();
    table.string("questionId").notNullable();
    table.string("reviewer").notNullable();
    table.string("status").notNullable();
    table.boolean("accuracyCheck").notNullable();
    table.boolean("naturalnessCheck").notNullable();
    table.text("notes");
    table.string("reviewedAt");
    table.index(["questionId"]);
  });

  await ensureTable(db, TABLES.explanationReviews, (table) => {
    table.string("id").primary();
    table.string("explanationId").notNullable();
    table.string("reviewer").notNullable();
    table.string("status").notNullable();
    table.boolean("accuracyCheck").notNullable();
    table.boolean("clarityCheck").notNullable();
    table.text("notes");
    table.string("reviewedAt");
    table.index(["explanationId"]);
  });

  await ensureTable(db, TABLES.questionTags, (table) => {
    table.string("questionId").notNullable();
    table.string("tagId").notNullable();
    table.unique(["questionId", "tagId"]);
  });

  await ensureTable(db, TABLES.userProgress, (table) => {
    table.string("learnerId").notNullable();
    table.string("questionId").notNullable();
    table.integer("attemptsTotal").notNullable();
    table.integer("correctTotal").notNullable();
    table.integer("incorrectTotal").notNullable();
    table.string("lastAnsweredAt").notNullable();
    table.string("firstAnsweredAt").notNullable();
    table.string("masteryLevel").notNullable();
    table.string("lastResult").notNullable();
    table.unique(["learnerId", "questionId"]);
  });

  await ensureTable(db, TABLES.examSessions, (table) => {
    table.string("id").primary();
    table.string("learnerId").notNullable();
    table.string("mode").notNullable();
    table.string("contentVersionId").notNullable();
    table.string("startedAt").notNullable();
    table.string("endedAt");
    table.integer("timeLimitSeconds");
    table.integer("questionCount").notNullable();
    table.integer("correctCount");
    table.integer("scorePercent");
    table.integer("passThresholdPercent");
    table.string("result").notNullable();
  });

  await ensureTable(db, TABLES.examSessionAnswers, (table) => {
    table.string("id").primary();
    table.string("examSessionId").notNullable();
    table.string("questionId").notNullable();
    table.string("selectedChoiceKey").notNullable();
    table.boolean("isCorrect").notNullable();
    table.string("answeredAt").notNullable();
    table.integer("responseTimeMs");
    table.index(["examSessionId"]);
  });

  await ensureTable(db, TABLES.glossaryTerms, (table) => {
    table.string("id").primary();
    table.string("termEn").notNullable();
    table.text("shortDefinitionEn").notNullable();
    table.text("longExplanationEn");
    table.string("relatedCategoryId");
    table.text("imageAssetPath");
    table.boolean("isTrafficSign").notNullable();
    table.integer("displayOrder").notNullable();
  });
}

async function isDatasetEmpty(db: Knex) {
  const metaRow = await db(TABLES.datasetMeta).first<{ count?: number }>("datasetId");
  return !metaRow;
}

async function clearDatabase(trx: Knex.Transaction) {
  for (const tableName of DELETE_ORDER) {
    await trx(tableName).del();
  }
}

async function insertInChunks(trx: Knex.Transaction, tableName: string, rows: Record<string, unknown>[], chunkSize = 50) {
  if (rows.length === 0) {
    return;
  }

  for (let index = 0; index < rows.length; index += chunkSize) {
    await trx(tableName).insert(rows.slice(index, index + chunkSize));
  }
}

function sanitizeRows<T extends object>(rows: T[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const entries = Object.entries(row as Record<string, unknown>).map(([key, value]) => [
      key,
      value === undefined ? null : value
    ]);

    return Object.fromEntries(entries);
  });
}

export async function replaceContentDatasetInDatabase(mode: RelationalContentStoreMode, dataset: SampleQuestionDataset) {
  const db = await getContentDatabase(mode);
  await ensureSchema(db);

  await db.transaction(async (trx) => {
    await clearDatabase(trx);

    await insertInChunks(trx, TABLES.datasetMeta, sanitizeRows([dataset.meta]));
    await insertInChunks(trx, TABLES.sourceReferences, sanitizeRows(dataset.sourceReferences));
    await insertInChunks(trx, TABLES.contentVersions, sanitizeRows(dataset.contentVersions));
    await insertInChunks(trx, TABLES.categories, sanitizeRows(dataset.categories));
    await insertInChunks(trx, TABLES.tags, sanitizeRows(dataset.tags));
    await insertInChunks(trx, TABLES.questions, sanitizeRows(dataset.questions));
    await insertInChunks(trx, TABLES.choices, sanitizeRows(dataset.choices));
    await insertInChunks(trx, TABLES.explanations, sanitizeRows(dataset.explanations));
    await insertInChunks(trx, TABLES.translationReviews, sanitizeRows(dataset.translationReviews));
    await insertInChunks(trx, TABLES.explanationReviews, sanitizeRows(dataset.explanationReviews));
    await insertInChunks(trx, TABLES.questionTags, sanitizeRows(dataset.questionTags));
    await insertInChunks(trx, TABLES.userProgress, sanitizeRows(dataset.userProgress));
    await insertInChunks(trx, TABLES.examSessions, sanitizeRows(dataset.examSessions));
    await insertInChunks(trx, TABLES.examSessionAnswers, sanitizeRows(dataset.examSessionAnswers));
    await insertInChunks(trx, TABLES.glossaryTerms, sanitizeRows(dataset.glossaryTerms));
  });
}

export async function loadContentDatasetFromDatabase(mode: RelationalContentStoreMode): Promise<SampleQuestionDataset> {
  const db = await getContentDatabase(mode);
  await ensureContentDatabaseReady(mode);

  const [
    metaRow,
    sourceReferences,
    contentVersions,
    categories,
    tags,
    questions,
    choices,
    explanations,
    translationReviews,
    explanationReviews,
    questionTags,
    userProgress,
    examSessions,
    examSessionAnswers,
    glossaryTerms
  ] = await Promise.all([
    db(TABLES.datasetMeta).first<Record<string, unknown>>(),
    db(TABLES.sourceReferences).select<Record<string, unknown>[]>("*"),
    db(TABLES.contentVersions).select<Record<string, unknown>[]>("*"),
    db(TABLES.categories).select<Record<string, unknown>[]>("*").orderBy("displayOrder", "asc"),
    db(TABLES.tags).select<Record<string, unknown>[]>("*"),
    db(TABLES.questions).select<Record<string, unknown>[]>("*"),
    db(TABLES.choices).select<Record<string, unknown>[]>("*").orderBy(["questionId", "displayOrder"]),
    db(TABLES.explanations).select<Record<string, unknown>[]>("*"),
    db(TABLES.translationReviews).select<Record<string, unknown>[]>("*"),
    db(TABLES.explanationReviews).select<Record<string, unknown>[]>("*"),
    db(TABLES.questionTags).select<Record<string, unknown>[]>("*"),
    db(TABLES.userProgress).select<Record<string, unknown>[]>("*"),
    db(TABLES.examSessions).select<Record<string, unknown>[]>("*"),
    db(TABLES.examSessionAnswers).select<Record<string, unknown>[]>("*"),
    db(TABLES.glossaryTerms).select<Record<string, unknown>[]>("*").orderBy("displayOrder", "asc")
  ]);

  if (!metaRow) {
    throw new Error("Content database is initialized but empty. Seed it before use.");
  }

  return {
    meta: normalizeMeta(metaRow),
    sourceReferences: sourceReferences.map(normalizeSourceReference),
    contentVersions: contentVersions.map(normalizeContentVersion),
    categories: categories.map(normalizeCategory),
    tags: tags.map(normalizeTag),
    questions: questions.map(normalizeQuestion),
    choices: choices.map(normalizeChoice),
    explanations: explanations.map(normalizeExplanation),
    translationReviews: translationReviews.map(normalizeTranslationReview),
    explanationReviews: explanationReviews.map(normalizeExplanationReview),
    questionTags: questionTags.map(normalizeQuestionTag),
    userProgress: userProgress.map(normalizeUserProgress),
    examSessions: examSessions.map(normalizeExamSession),
    examSessionAnswers: examSessionAnswers.map(normalizeExamSessionAnswer),
    glossaryTerms: glossaryTerms.map(normalizeGlossaryTerm)
  };
}

export async function seedContentDatabaseFromSampleDataset(mode: RelationalContentStoreMode) {
  const dataset = await loadSampleDataset();
  await replaceContentDatasetInDatabase(mode, dataset);
}

export async function getContentDatabase(mode: RelationalContentStoreMode) {
  if (!globalThis.__passdriveContentDb) {
    globalThis.__passdriveContentDb = createKnexInstance(mode);
  }

  return globalThis.__passdriveContentDb;
}

export async function ensureContentDatabaseReady(mode: RelationalContentStoreMode) {
  if (!globalThis.__passdriveContentDbReady) {
    globalThis.__passdriveContentDbReady = (async () => {
      const db = await getContentDatabase(mode);
      await ensureSchema(db);

      if ((await isDatasetEmpty(db)) && shouldAutoSeedContentDatabase(mode)) {
        const dataset = await loadSampleDataset();
        await replaceContentDatasetInDatabase(mode, dataset);
      }
    })();
  }

  return globalThis.__passdriveContentDbReady;
}

export async function destroyContentDatabase() {
  if (!globalThis.__passdriveContentDb) {
    return;
  }

  const db = await globalThis.__passdriveContentDb;
  await db.destroy();
  globalThis.__passdriveContentDb = undefined;
  globalThis.__passdriveContentDbReady = undefined;
}
