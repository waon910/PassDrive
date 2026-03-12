import type { QuestionBundle } from "@/domain/content-types";
import type { LearnerHistorySnapshot, StoredMockExamRun, StoredQuestionAttempt } from "@/domain/learner-history-types";
import type { SessionAnswerMap, SessionSummary } from "@/domain/session-rules";
import { isChoiceCorrect } from "@/domain/session-rules";

const DB_NAME = "passdrive";
const DB_VERSION = 1;
const STORE_NAME = "app_state";
const HISTORY_KEY = "learner_history";

const EMPTY_HISTORY: LearnerHistorySnapshot = {
  schemaVersion: 1,
  questionAttempts: [],
  mockExamRuns: []
};

function canUseIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function readHistory(): Promise<LearnerHistorySnapshot> {
  if (!canUseIndexedDb()) {
    return EMPTY_HISTORY;
  }

  const database = await openDatabase();

  return new Promise<LearnerHistorySnapshot>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(HISTORY_KEY);

    request.onerror = () => reject(request.error ?? new Error("Failed to read learner history."));
    request.onsuccess = () => {
      const result = request.result as LearnerHistorySnapshot | undefined;
      resolve(result ?? EMPTY_HISTORY);
    };
  }).finally(() => {
    database.close();
  });
}

async function writeHistory(history: LearnerHistorySnapshot): Promise<void> {
  if (!canUseIndexedDb()) {
    return;
  }

  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(history, HISTORY_KEY);

    request.onerror = () => reject(request.error ?? new Error("Failed to write learner history."));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to persist learner history."));
  }).finally(() => {
    database.close();
  });
}

async function updateHistory(
  updater: (current: LearnerHistorySnapshot) => LearnerHistorySnapshot
): Promise<LearnerHistorySnapshot> {
  const current = await readHistory();
  const next = updater(current);
  await writeHistory(next);
  return next;
}

function buildAttemptId(questionId: string, mode: StoredQuestionAttempt["mode"], answeredAt: string) {
  return `${mode}_${questionId}_${answeredAt}`;
}

function buildMockRunId(completedAt: string) {
  return `mock_exam_${completedAt}`;
}

export async function loadLearnerHistorySnapshot() {
  return readHistory();
}

export async function resetLearnerHistorySnapshot() {
  await writeHistory(EMPTY_HISTORY);
  return EMPTY_HISTORY;
}

export async function recordPracticeAttempt(bundle: QuestionBundle, selectedChoiceKey: string) {
  const answeredAt = new Date().toISOString();
  const attempt: StoredQuestionAttempt = {
    id: buildAttemptId(bundle.question.id, "practice", answeredAt),
    questionId: bundle.question.id,
    categoryId: bundle.category.id,
    mode: "practice",
    selectedChoiceKey,
    isCorrect: isChoiceCorrect(bundle, selectedChoiceKey),
    answeredAt
  };

  return updateHistory((current) => ({
    ...current,
    questionAttempts: [...current.questionAttempts, attempt]
  }));
}

export async function recordMockExamResult(
  questionBundles: QuestionBundle[],
  answers: SessionAnswerMap,
  summary: SessionSummary,
  passThresholdPercent: number
) {
  const completedAt = new Date().toISOString();
  const attempts: StoredQuestionAttempt[] = questionBundles.flatMap((bundle) => {
    const selectedChoiceKey = answers[bundle.question.id];

    if (!selectedChoiceKey) {
      return [];
    }

    return [
      {
        id: buildAttemptId(bundle.question.id, "mock_exam", `${completedAt}_${bundle.question.id}`),
        questionId: bundle.question.id,
        categoryId: bundle.category.id,
        mode: "mock_exam",
        selectedChoiceKey,
        isCorrect: isChoiceCorrect(bundle, selectedChoiceKey),
        answeredAt: completedAt
      }
    ];
  });

  const mockExamRun: StoredMockExamRun = {
    id: buildMockRunId(completedAt),
    completedAt,
    questionCount: summary.totalQuestions,
    correctCount: summary.correctAnswers,
    incorrectCount: summary.incorrectAnswers,
    unansweredCount: summary.unansweredQuestions,
    scorePercent: summary.scorePercent,
    passThresholdPercent,
    passed: summary.passed
  };

  return updateHistory((current) => ({
    ...current,
    questionAttempts: [...current.questionAttempts, ...attempts],
    mockExamRuns: [...current.mockExamRuns, mockExamRun]
  }));
}
