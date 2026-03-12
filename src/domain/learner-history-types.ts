export type StoredAttemptMode = "practice" | "mock_exam";

export interface StoredQuestionAttempt {
  id: string;
  questionId: string;
  categoryId: string;
  mode: StoredAttemptMode;
  selectedChoiceKey: string;
  isCorrect: boolean;
  answeredAt: string;
}

export interface StoredMockExamRun {
  id: string;
  completedAt: string;
  questionCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  scorePercent: number;
  passThresholdPercent: number;
  passed: boolean;
}

export interface LearnerHistorySnapshot {
  schemaVersion: 1;
  questionAttempts: StoredQuestionAttempt[];
  mockExamRuns: StoredMockExamRun[];
}
