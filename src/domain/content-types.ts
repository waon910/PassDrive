export type SourceType = "official_site" | "official_pdf" | "official_booklet" | "other";
export type RegionScope = "national" | "prefecture_specific";
export type RightsStatus = "unchecked" | "review_required" | "approved" | "rejected";
export type ContentVersionStatus = "draft" | "active" | "superseded";
export type QuestionType = "true_false" | "single_choice";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionStatus =
  | "draft"
  | "translation_review"
  | "explanation_review"
  | "ready"
  | "published"
  | "archived";
export type ExplanationOrigin = "source" | "ai" | "manual";
export type ReviewStatus = "pending" | "approved" | "changes_requested";
export type MasteryLevel = "new" | "learning" | "needs_review" | "mastered";
export type AnswerResult = "correct" | "incorrect";
export type ExamMode = "mock_exam" | "practice_set" | "mistakes_only";
export type ExamResult = "in_progress" | "pass" | "fail" | "abandoned";
export type LocaleCode = "ja" | "en";

export interface SampleDatasetMeta {
  datasetId: string;
  datasetType: string;
  locale: string;
  notes: string;
  generatedAt: string;
}

export interface SourceReference {
  id: string;
  sourceName: string;
  sourceType: SourceType;
  sourceUrl?: string;
  publisher?: string;
  regionScope: RegionScope;
  originalLanguage: LocaleCode;
  fetchedAt: string;
  snapshotPath?: string;
  rightsStatus: RightsStatus;
  rightsNotes?: string;
  lastVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentVersion {
  id: string;
  label: string;
  status: ContentVersionStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  releaseNotes?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  labelEn: string;
  descriptionEn?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Tag {
  id: string;
  slug: string;
  labelEn: string;
}

export interface Question {
  id: string;
  sourceReferenceId: string;
  contentVersionId: string;
  sourceQuestionRef?: string;
  questionType: QuestionType;
  mainCategoryId: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  originalStem: string;
  originalLanguage: LocaleCode;
  englishStem: string;
  correctChoiceKey: string;
  hasImage: boolean;
  imageAssetPath?: string;
  explanationOrigin: ExplanationOrigin;
  activeExplanationId: string;
  translationReviewStatus: ReviewStatus;
  explanationReviewStatus: ReviewStatus;
  isExamEligible: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Choice {
  id: string;
  questionId: string;
  choiceKey: string;
  displayOrder: number;
  originalText?: string;
  englishText: string;
  isCorrect: boolean;
}

export interface Explanation {
  id: string;
  questionId: string;
  origin: ExplanationOrigin;
  bodyEn: string;
  sourceDerived: boolean;
  aiModel?: string;
  aiPromptVersion?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationReview {
  id: string;
  questionId: string;
  reviewer: string;
  status: ReviewStatus;
  accuracyCheck: boolean;
  naturalnessCheck: boolean;
  notes?: string;
  reviewedAt?: string;
}

export interface ExplanationReview {
  id: string;
  explanationId: string;
  reviewer: string;
  status: ReviewStatus;
  accuracyCheck: boolean;
  clarityCheck: boolean;
  notes?: string;
  reviewedAt?: string;
}

export interface QuestionTag {
  questionId: string;
  tagId: string;
}

export interface UserProgress {
  learnerId: string;
  questionId: string;
  attemptsTotal: number;
  correctTotal: number;
  incorrectTotal: number;
  lastAnsweredAt: string;
  firstAnsweredAt: string;
  masteryLevel: MasteryLevel;
  lastResult: AnswerResult;
}

export interface ExamSession {
  id: string;
  learnerId: string;
  mode: ExamMode;
  contentVersionId: string;
  startedAt: string;
  endedAt?: string;
  timeLimitSeconds?: number;
  questionCount: number;
  correctCount?: number;
  scorePercent?: number;
  passThresholdPercent?: number;
  result: ExamResult;
}

export interface ExamSessionAnswer {
  id: string;
  examSessionId: string;
  questionId: string;
  selectedChoiceKey: string;
  isCorrect: boolean;
  answeredAt: string;
  responseTimeMs?: number;
}

export interface GlossaryTerm {
  id: string;
  termEn: string;
  shortDefinitionEn: string;
  longExplanationEn?: string;
  relatedCategoryId?: string;
  imageAssetPath?: string;
  isTrafficSign: boolean;
  displayOrder: number;
}

export interface SampleQuestionDataset {
  meta: SampleDatasetMeta;
  sourceReferences: SourceReference[];
  contentVersions: ContentVersion[];
  categories: Category[];
  tags: Tag[];
  questions: Question[];
  choices: Choice[];
  explanations: Explanation[];
  translationReviews: TranslationReview[];
  explanationReviews: ExplanationReview[];
  questionTags: QuestionTag[];
  userProgress: UserProgress[];
  examSessions: ExamSession[];
  examSessionAnswers: ExamSessionAnswer[];
  glossaryTerms: GlossaryTerm[];
}

export interface QuestionBundle {
  question: Question;
  sourceReference: SourceReference;
  category: Category;
  choices: Choice[];
  explanation: Explanation;
  translationReview?: TranslationReview;
  explanationReview?: ExplanationReview;
  tags: Tag[];
}

export interface DatasetOverview {
  datasetId: string;
  locale: string;
  generatedAt: string;
  questionCount: number;
  publishedQuestionCount: number;
  mockExamCount: number;
  glossaryTermCount: number;
  categoryCount: number;
}
