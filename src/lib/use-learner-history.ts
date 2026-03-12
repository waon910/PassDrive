"use client";

import { useEffect, useState } from "react";

import type { LearnerHistorySnapshot } from "@/domain/learner-history-types";
import { loadLearnerHistorySnapshot } from "@/lib/learner-history-store";

const EMPTY_HISTORY: LearnerHistorySnapshot = {
  schemaVersion: 1,
  questionAttempts: [],
  mockExamRuns: []
};

export function useLearnerHistory() {
  const [history, setHistory] = useState<LearnerHistorySnapshot>(EMPTY_HISTORY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    void loadLearnerHistorySnapshot()
      .then((snapshot) => {
        if (!active) {
          return;
        }

        setHistory(snapshot);
        setIsLoaded(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setHistory(EMPTY_HISTORY);
        setIsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    history,
    isLoaded,
    setHistory
  };
}
