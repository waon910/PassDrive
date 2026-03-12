"use client";

import { useState } from "react";

import { QuestionFigure } from "@/components/question-figure";
import { buildSessionSummary, isChoiceCorrect } from "@/domain/session-rules";
import type { QuestionBundle } from "@/domain/content-types";
import { recordPracticeAttempt } from "@/lib/learner-history-store";
import type { CategoryProgressSummary } from "@/lib/sample-dataset";

interface PracticeRunnerProps {
  questionBundles: QuestionBundle[];
  categoryProgress: CategoryProgressSummary[];
  mistakeQuestionIds: string[];
}

type PracticeMode = "random" | "category" | "mistakes";

function shuffleBundles(bundles: QuestionBundle[]) {
  const next = [...bundles];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function getModeLabel(mode: PracticeMode) {
  if (mode === "mistakes") {
    return "Mistakes First";
  }

  if (mode === "category") {
    return "By Category";
  }

  return "Random";
}

export function PracticeRunner({
  questionBundles,
  categoryProgress,
  mistakeQuestionIds
}: PracticeRunnerProps) {
  const [mode, setMode] = useState<PracticeMode>("random");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categoryProgress[0]?.category.id ?? "");
  const [sessionBundles, setSessionBundles] = useState<QuestionBundle[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceKey, setSelectedChoiceKey] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentBundle = sessionBundles[currentIndex];
  const summary = completed ? buildSessionSummary(sessionBundles, answers, 80) : null;

  function buildBundleSet() {
    if (mode === "mistakes") {
      return questionBundles.filter((bundle) => mistakeQuestionIds.includes(bundle.question.id));
    }

    if (mode === "category") {
      return questionBundles.filter((bundle) => bundle.category.id === selectedCategoryId);
    }

    return shuffleBundles(questionBundles);
  }

  function startSession() {
    const nextBundles = buildBundleSet();

    setSessionBundles(nextBundles);
    setAnswers({});
    setCurrentIndex(0);
    setSelectedChoiceKey(null);
    setSubmitted(false);
    setCompleted(false);
  }

  function submitCurrentAnswer() {
    if (!currentBundle || !selectedChoiceKey) {
      return;
    }

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentBundle.question.id]: selectedChoiceKey
    }));
    setSubmitted(true);
    void recordPracticeAttempt(currentBundle, selectedChoiceKey);
  }

  function moveNext() {
    if (!currentBundle) {
      return;
    }

    if (currentIndex === sessionBundles.length - 1) {
      setCompleted(true);
      setSelectedChoiceKey(null);
      setSubmitted(false);
      return;
    }

    setCurrentIndex((value) => value + 1);
    setSelectedChoiceKey(null);
    setSubmitted(false);
  }

  const availableBundleCount = buildBundleSet().length;
  const modeLabel = getModeLabel(mode);

  if (!currentBundle && !completed) {
    return (
      <section className="study-setup-layout">
        <article className="surface-card focus-card practice-setup-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Practice Setup</p>
              <h2>Choose a set and keep the next action simple.</h2>
            </div>
            <span className="chip">{availableBundleCount} question(s)</span>
          </div>

          <p className="small-copy">
            {mode === "mistakes"
              ? "Retry only questions you have missed."
              : mode === "category"
                ? "Pick one category and stay focused."
                : "Use a mixed set for quick recall."}
          </p>

          <div className="mode-toggle" role="tablist" aria-label="Practice mode">
            {(["random", "category", "mistakes"] as PracticeMode[]).map((option) => (
              <button
                key={option}
                className={mode === option ? "mode-button active" : "mode-button"}
                type="button"
                onClick={() => setMode(option)}
              >
                {getModeLabel(option)}
              </button>
            ))}
          </div>

          {mode === "category" ? (
            <div className="category-picker" aria-label="Category picker">
              {categoryProgress.map((item) => (
                <button
                  key={item.category.id}
                  className={selectedCategoryId === item.category.id ? "category-chip active" : "category-chip"}
                  type="button"
                  onClick={() => setSelectedCategoryId(item.category.id)}
                >
                  {item.category.labelEn}
                </button>
              ))}
            </div>
          ) : null}

          <div className="action-row">
            <button className="primary-button" type="button" onClick={startSession} disabled={availableBundleCount === 0}>
              Start Set
            </button>
          </div>

          {availableBundleCount === 0 ? (
            <p className="small-copy">No questions currently match this practice setup.</p>
          ) : null}
        </article>

        <aside className="study-side-stack">
          <article className="surface-card study-support-card">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Snapshot</p>
                <h2>Keep the setup lightweight.</h2>
              </div>
            </div>

            <div className="compact-metrics">
              <div className="compact-metric">
                <span>Question pool</span>
                <strong>{questionBundles.length}</strong>
              </div>
              <div className="compact-metric">
                <span>Categories</span>
                <strong>{categoryProgress.length}</strong>
              </div>
              <div className="compact-metric">
                <span>Mistakes ready</span>
                <strong>{mistakeQuestionIds.length}</strong>
              </div>
            </div>
          </article>

          <article className="surface-card study-support-card">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Category Accuracy</p>
                <h2>Use one category when you need a focused repair pass.</h2>
              </div>
            </div>

            <div className="compact-metrics">
              {categoryProgress.map((item) => (
                <div key={item.category.id} className="compact-metric">
                  <span>{item.category.labelEn}</span>
                  <strong>{item.accuracyPercent}%</strong>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    );
  }

  if (currentBundle && !completed) {
    const selectedChoice = currentBundle.choices.find((choice) => choice.choiceKey === selectedChoiceKey);

    return (
      <section className="study-session-layout">
        <article className="surface-card focus-card study-main-card practice-runner">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Practice Question</p>
              <h2>{currentBundle.category.labelEn}</h2>
            </div>
            <span className="chip">
              {currentIndex + 1} / {sessionBundles.length}
            </span>
          </div>

          <div className="study-status-row" aria-label="Practice status">
            <span className="home-highlight-chip">Mode {modeLabel}</span>
            <span className="home-highlight-chip">{currentBundle.choices.length} choice(s)</span>
            <span className="home-highlight-chip">{submitted ? "Answer locked" : "Choose one answer"}</span>
          </div>

          <div className="progress-track" aria-hidden="true">
            <div
              className="progress-fill"
              style={{ width: `${((currentIndex + 1) / Math.max(sessionBundles.length, 1)) * 100}%` }}
            />
          </div>

          <p className="question-stem">{currentBundle.question.englishStem}</p>

          <div className="choice-stack" role="radiogroup" aria-label="Answer choices">
            {currentBundle.choices.map((choice) => {
              const isSelected = selectedChoiceKey === choice.choiceKey;
              const showCorrect = submitted && choice.isCorrect;
              const showIncorrect = submitted && isSelected && !choice.isCorrect;

              return (
                <button
                  key={choice.id}
                  className={[
                    "choice-button",
                    isSelected ? "selected" : "",
                    showCorrect ? "correct" : "",
                    showIncorrect ? "incorrect" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  type="button"
                  onClick={() => setSelectedChoiceKey(choice.choiceKey)}
                  aria-pressed={isSelected}
                  disabled={submitted}
                >
                  <span className="choice-key">{choice.choiceKey}</span>
                  <span>{choice.englishText}</span>
                </button>
              );
            })}
          </div>

          <div className="practice-actions study-action-bar">
            <button
              className="primary-button"
              type="button"
              onClick={submitCurrentAnswer}
              disabled={!selectedChoiceKey || submitted}
            >
              Submit Answer
            </button>
            {submitted ? (
              <button className="secondary-button" type="button" onClick={moveNext}>
                {currentIndex === sessionBundles.length - 1 ? "Finish Set" : "Next Question"}
              </button>
            ) : (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setSessionBundles([]);
                  setSelectedChoiceKey(null);
                  setSubmitted(false);
                }}
              >
                Back to Setup
              </button>
            )}
          </div>

          <div className="result-banner" aria-live="polite">
            <strong>
              {submitted
                ? isChoiceCorrect(currentBundle, selectedChoiceKey ?? undefined)
                  ? "Correct"
                  : "Incorrect"
                : "Choose one answer"}
            </strong>
            <span>{currentBundle.category.labelEn}</span>
            <span>{selectedChoice ? `Selected ${selectedChoice.choiceKey}` : "No answer selected yet"}</span>
          </div>
        </article>

        <aside className="study-side-stack">
          <article className="surface-card study-support-card study-sticky-card">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Question Context</p>
                <h2>Keep the answer and the explanation close.</h2>
              </div>
            </div>

            <div className="compact-metrics">
              <div className="compact-metric">
                <span>Mode</span>
                <strong>{modeLabel}</strong>
              </div>
              <div className="compact-metric">
                <span>Category</span>
                <strong>{currentBundle.category.labelEn}</strong>
              </div>
              <div className="compact-metric">
                <span>Question</span>
                <strong>
                  {currentIndex + 1} / {sessionBundles.length}
                </strong>
              </div>
              <div className="compact-metric">
                <span>Status</span>
                <strong>{submitted ? "Submitted" : "Selecting"}</strong>
              </div>
            </div>
          </article>

          {currentBundle.question.hasImage ? (
            <article className="surface-card study-support-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Figure</p>
                  <h2>Reference the visual without leaving the question.</h2>
                </div>
              </div>

              <QuestionFigure question={currentBundle.question} size="compact" />
            </article>
          ) : null}

          <article className="surface-card study-support-card">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Why</p>
                <h2>{submitted ? "Read the explanation, then continue." : "Explanation appears after you submit."}</h2>
              </div>
            </div>

            {submitted ? (
              <div className="explanation-panel explanation-panel-inline">
                <p>{currentBundle.explanation.bodyEn}</p>
              </div>
            ) : (
              <p className="small-copy">
                Submit one answer first. The explanation stays in this side panel so the next question remains in view.
              </p>
            )}
          </article>
        </aside>
      </section>
    );
  }

  return completed && summary ? (
    <article className="surface-card focus-card session-summary">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Set Complete</p>
          <h2>Use the result to choose the next pass.</h2>
        </div>
        <span className="chip">{summary.scorePercent}%</span>
      </div>

      <dl className="detail-list">
        <div>
          <dt>Correct answers</dt>
          <dd>{summary.correctAnswers}</dd>
        </div>
        <div>
          <dt>Incorrect answers</dt>
          <dd>{summary.incorrectAnswers}</dd>
        </div>
        <div>
          <dt>Answered</dt>
          <dd>{summary.answeredQuestions}</dd>
        </div>
      </dl>

      <div className="stack-list">
        {summary.categoryBreakdown.map((item) => (
          <div key={item.categoryId} className="list-card">
            <div>
              <span>{item.categoryLabel}</span>
              <small>
                {item.correct} / {item.total} correct
              </small>
            </div>
            <strong>{item.accuracyPercent}%</strong>
          </div>
        ))}
      </div>

      <div className="action-row">
        <button className="primary-button" type="button" onClick={startSession}>
          Run Another Set
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setSessionBundles([]);
            setCompleted(false);
          }}
        >
          Back to Setup
        </button>
      </div>
    </article>
  ) : null;
}
