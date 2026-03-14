export type SourceType = "official_site" | "official_pdf" | "official_booklet" | "other";
export type RegionScope = "national" | "prefecture_specific";
export type ContentVersionStatus = "draft" | "active" | "superseded";
export type QuestionType = "true_false" | "single_choice" | "hazard_prediction";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionStatus = "published" | "unpublished";
export type ExplanationOrigin = "source" | "ai" | "manual";
export type MasteryLevel = "new" | "learning" | "needs_review" | "mastered";
export type AnswerResult = "correct" | "incorrect";
export type ExamMode = "mock_exam" | "practice_set" | "mistakes_only";
export type ExamResult = "in_progress" | "pass" | "fail" | "abandoned";
export type LocaleCode = "ja" | "en";
export type PromptChoiceKey = "T" | "F";
export type TrafficSignKind =
  | "warning"
  | "prohibitory"
  | "mandatory"
  | "priority"
  | "supplemental"
  | "expressway"
  | "regulatory"
  | "other";

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
  rightsNotes?: string;
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
  correctChoiceKey?: string;
  pointValue?: number;
  hasImage: boolean;
  imageAssetPath?: string;
  imageAltTextEn?: string;
  imageCaptionEn?: string;
  explanationOrigin: ExplanationOrigin;
  activeExplanationId: string;
  isExamEligible: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionPrompt {
  id: string;
  questionId: string;
  promptKey: string;
  displayOrder: number;
  originalText: string;
  englishText: string;
  correctChoiceKey: PromptChoiceKey;
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
  possiblePoints?: number;
  scorePoints?: number;
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
  sourceReferenceId?: string;
  imageAssetPath?: string;
  imageAltTextEn?: string;
  isTrafficSign: boolean;
  trafficSignKind?: TrafficSignKind;
  displayOrder: number;
}

export interface SampleQuestionDataset {
  meta: SampleDatasetMeta;
  sourceReferences: SourceReference[];
  contentVersions: ContentVersion[];
  categories: Category[];
  tags: Tag[];
  questions: Question[];
  questionPrompts: QuestionPrompt[];
  choices: Choice[];
  explanations: Explanation[];
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
  questionPrompts: QuestionPrompt[];
  choices: Choice[];
  explanation: Explanation;
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
