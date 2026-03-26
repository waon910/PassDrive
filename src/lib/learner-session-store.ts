import type { SessionAnswerMap } from "@/domain/session-rules";

const DB_NAME = "passdrive";
const DB_VERSION = 1;
const STORE_NAME = "app_state";
const PRACTICE_SESSION_KEY = "practice_session";
const MOCK_EXAM_SESSION_KEY = "mock_exam_session";

export type StoredPracticeMode = "random" | "category" | "mistakes";

interface StoredSessionBase {
  schemaVersion: 1;
  questionIds: string[];
  answers: SessionAnswerMap;
  currentIndex: number;
  savedAt: string;
}

export interface StoredPracticeSessionSnapshot extends StoredSessionBase {
  mode: StoredPracticeMode;
  selectedCategoryId: string;
  submitted: boolean;
}

export interface StoredMockExamSessionSnapshot extends StoredSessionBase {
  remainingSeconds: number;
}

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

async function readValue<T>(key: string): Promise<T | undefined> {
  if (!canUseIndexedDb()) {
    return undefined;
  }

  const database = await openDatabase();

  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onerror = () => reject(request.error ?? new Error("Failed to read stored learner session."));
    request.onsuccess = () => resolve(request.result as T | undefined);
  }).finally(() => {
    database.close();
  });
}

async function writeValue<T>(key: string, value: T): Promise<void> {
  if (!canUseIndexedDb()) {
    return;
  }

  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onerror = () => reject(request.error ?? new Error("Failed to write stored learner session."));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to persist learner session."));
  }).finally(() => {
    database.close();
  });
}

async function deleteValue(key: string): Promise<void> {
  if (!canUseIndexedDb()) {
    return;
  }

  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onerror = () => reject(request.error ?? new Error("Failed to clear stored learner session."));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to clear learner session."));
  }).finally(() => {
    database.close();
  });
}

export async function loadPracticeSessionSnapshot() {
  return readValue<StoredPracticeSessionSnapshot>(PRACTICE_SESSION_KEY);
}

export async function savePracticeSessionSnapshot(snapshot: StoredPracticeSessionSnapshot) {
  await writeValue(PRACTICE_SESSION_KEY, snapshot);
}

export async function clearPracticeSessionSnapshot() {
  await deleteValue(PRACTICE_SESSION_KEY);
}

export async function loadMockExamSessionSnapshot() {
  return readValue<StoredMockExamSessionSnapshot>(MOCK_EXAM_SESSION_KEY);
}

export async function saveMockExamSessionSnapshot(snapshot: StoredMockExamSessionSnapshot) {
  await writeValue(MOCK_EXAM_SESSION_KEY, snapshot);
}

export async function clearMockExamSessionSnapshot() {
  await deleteValue(MOCK_EXAM_SESSION_KEY);
}

export function getRestoredRemainingSeconds(snapshot: StoredMockExamSessionSnapshot) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(snapshot.savedAt).getTime()) / 1000));
  return Math.max(0, snapshot.remainingSeconds - elapsedSeconds);
}
