"use client";

import { useEffect, useState } from "react";

import { QuestionFigure } from "@/components/question-figure";
import {
  buildSessionSummary,
  getQuestionPromptCount,
  isQuestionCorrect,
  isResponseComplete,
  type SessionAnswerMap,
  type SessionQuestionResponse
} from "@/domain/session-rules";
import type { PromptChoiceKey, QuestionBundle } from "@/domain/content-types";
import { unpublishQuestionAction } from "@/features/admin-review/review-actions";
import { recordPracticeAttempt } from "@/lib/learner-history-store";
import type { CategoryProgressSummary } from "@/lib/sample-dataset";

interface PracticeRunnerProps {
  questionBundles: QuestionBundle[];
  categoryProgress: CategoryProgressSummary[];
  mistakeQuestionIds: string[];
}

type PracticeMode = "random" | "category" | "mistakes";
type ChoiceStateTone = "selected" | "correct" | "incorrect";

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

function getCategoryProgressDetail(item: CategoryProgressSummary) {
  if (item.attempts === 0) {
    return "No attempts yet";
  }

  return `${item.correct} of ${item.attempts} answered correctly`;
}

function getChoiceStateTone(isSelected: boolean, showCorrect: boolean, showIncorrect: boolean): ChoiceStateTone | undefined {
  if (showCorrect) {
    return "correct";
  }

  if (showIncorrect) {
    return "incorrect";
  }

  if (isSelected) {
    return "selected";
  }

  return undefined;
}

function getChoiceStateLabel(stateTone?: ChoiceStateTone) {
  if (stateTone === "correct") {
    return "Correct answer";
  }

  if (stateTone === "incorrect") {
    return "Your answer";
  }

  if (stateTone === "selected") {
    return "Selected";
  }

  return undefined;
}

export function PracticeRunner({
  questionBundles,
  categoryProgress,
  mistakeQuestionIds
}: PracticeRunnerProps) {
  const [mode, setMode] = useState<PracticeMode>("random");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categoryProgress[0]?.category.id ?? "");
  const [sessionBundles, setSessionBundles] = useState<QuestionBundle[]>([]);
  const [answers, setAnswers] = useState<SessionAnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftResponse, setDraftResponse] = useState<SessionQuestionResponse | undefined>(undefined);
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
    setDraftResponse(undefined);
    setSubmitted(false);
    setCompleted(false);
  }

  function submitCurrentAnswer() {
    if (!currentBundle || !draftResponse || !isResponseComplete(currentBundle, draftResponse)) {
      return;
    }

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentBundle.question.id]: draftResponse
    }));
    setSubmitted(true);
    void recordPracticeAttempt(currentBundle, draftResponse);
  }

  function moveNext() {
    if (!currentBundle) {
      return;
    }

    if (currentIndex === sessionBundles.length - 1) {
      setCompleted(true);
      setDraftResponse(undefined);
      setSubmitted(false);
      return;
    }

    setCurrentIndex((value) => value + 1);
    setDraftResponse(undefined);
    setSubmitted(false);
  }

  function selectChoice(choiceKey: string) {
    setDraftResponse({
      kind: "single_choice",
      selectedChoiceKey: choiceKey
    });
  }

  function selectPromptChoice(promptKey: string, choiceKey: PromptChoiceKey) {
    const currentPromptChoices = draftResponse?.kind === "hazard_prediction" ? draftResponse.promptChoiceKeys : {};

    setDraftResponse({
      kind: "hazard_prediction",
      promptChoiceKeys: {
        ...currentPromptChoices,
        [promptKey]: choiceKey
      }
    });
  }

  useEffect(() => {
    setDraftResponse(undefined);
    setSubmitted(false);
  }, [currentIndex]);

  const availableBundleCount = buildBundleSet().length;
  const modeLabel = getModeLabel(mode);
  const lockedResponse = submitted && currentBundle ? answers[currentBundle.question.id] : draftResponse;

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
                <p className="eyebrow">Accuracy Rate by Category</p>
                <h2>Each percentage shows your accuracy rate for that category.</h2>
              </div>
            </div>

            <div className="compact-metrics">
              {categoryProgress.map((item) => (
                <div key={item.category.id} className="compact-metric">
                  <div className="compact-metric-copy">
                    <span>{item.category.labelEn}</span>
                    <small>{getCategoryProgressDetail(item)}</small>
                  </div>
                  <strong>{item.accuracyPercent}% accuracy</strong>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    );
  }

  if (currentBundle && !completed) {
    const singleChoiceResponse = lockedResponse?.kind === "single_choice" ? lockedResponse : undefined;

    return (
      <section className="study-session-layout">
        <article className="surface-card focus-card study-main-card practice-runner">
          <div className="panel-head">
            <div>
              <p className="eyebrow">
                {currentBundle.question.questionType === "hazard_prediction" ? "Hazard Practice" : "Practice Question"}
              </p>
              <h2>{currentBundle.category.labelEn}</h2>
            </div>
            <span className="chip">
              {currentIndex + 1} / {sessionBundles.length}
            </span>
          </div>

          <div className="study-status-row" aria-label="Practice status">
            <span className="home-highlight-chip">Mode {modeLabel}</span>
            <span className="home-highlight-chip">
              {getQuestionPromptCount(currentBundle)} {currentBundle.question.questionType === "hazard_prediction" ? "statements" : "choice(s)"}
            </span>
            <span className="home-highlight-chip">
              {submitted
                ? "Answer locked"
                : currentBundle.question.questionType === "hazard_prediction"
                  ? "Complete all statements"
                  : "Choose one answer"}
            </span>
          </div>

          <div className="progress-track" aria-hidden="true">
            <div
              className="progress-fill"
              style={{ width: `${((currentIndex + 1) / Math.max(sessionBundles.length, 1)) * 100}%` }}
            />
          </div>

          {currentBundle.question.hasImage ? (
            <div className="practice-question-visual">
              <QuestionFigure question={currentBundle.question} />
            </div>
          ) : null}

          <p className="question-stem">{currentBundle.question.englishStem}</p>

          {currentBundle.question.questionType === "hazard_prediction" ? (
            <div className="hazard-prompt-list">
              {currentBundle.questionPrompts.map((prompt) => {
                const hazardResponse = lockedResponse?.kind === "hazard_prediction" ? lockedResponse : undefined;
                const selectedChoiceKey = hazardResponse?.promptChoiceKeys[prompt.promptKey];

                return (
                  <article key={prompt.id} className="hazard-prompt-card">
                    <div className="panel-head">
                      <div>
                        <p className="eyebrow">Statement {prompt.displayOrder}</p>
                      </div>
                    </div>

                    <p>{prompt.englishText}</p>

                    <div className="hazard-choice-row" role="radiogroup" aria-label={`Statement ${prompt.displayOrder} answer`}>
                      {(["T", "F"] as PromptChoiceKey[]).map((choiceKey) => {
                        const isSelected = selectedChoiceKey === choiceKey;
                        const showCorrect = submitted && prompt.correctChoiceKey === choiceKey;
                        const showIncorrect = submitted && isSelected && prompt.correctChoiceKey !== choiceKey;
                        const stateTone = getChoiceStateTone(isSelected, showCorrect, showIncorrect);
                        const stateLabel = getChoiceStateLabel(stateTone);

                        return (
                          <button
                            key={choiceKey}
                            className={[
                              "choice-button",
                              "hazard-choice-button",
                              isSelected ? "selected" : "",
                              showCorrect ? "correct" : "",
                              showIncorrect ? "incorrect" : ""
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            type="button"
                            onClick={() => selectPromptChoice(prompt.promptKey, choiceKey)}
                            aria-pressed={isSelected}
                            disabled={submitted}
                          >
                            <span className="choice-key">{choiceKey === "T" ? "True" : "False"}</span>
                            {stateLabel ? (
                              <span className={`choice-state-badge ${stateTone}`}>
                                {stateLabel}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="choice-stack" role="radiogroup" aria-label="Answer choices">
              {currentBundle.choices.map((choice) => {
                const isSelected = singleChoiceResponse?.selectedChoiceKey === choice.choiceKey;
                const showCorrect = submitted && choice.isCorrect;
                const showIncorrect = submitted && isSelected && !choice.isCorrect;
                const stateTone = getChoiceStateTone(isSelected, showCorrect, showIncorrect);
                const stateLabel = getChoiceStateLabel(stateTone);

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
                    onClick={() => selectChoice(choice.choiceKey)}
                    aria-pressed={isSelected}
                    disabled={submitted}
                  >
                    <span className="choice-key">{choice.choiceKey}</span>
                    <span className="choice-copy">
                      <span className="choice-text">{choice.englishText}</span>
                      {stateLabel ? (
                        <span className={`choice-state-badge ${stateTone}`}>
                          {stateLabel}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="practice-actions study-action-bar">
            <div className="practice-actions-primary">
              <button
                className="primary-button"
                type="button"
                onClick={submitCurrentAnswer}
                disabled={!currentBundle || !draftResponse || !isResponseComplete(currentBundle, draftResponse) || submitted}
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
                    setDraftResponse(undefined);
                    setSubmitted(false);
                  }}
                >
                  Back to Setup
                </button>
              )}
            </div>
            <form action={unpublishQuestionAction} className="practice-actions-secondary">
              <input type="hidden" name="questionId" value={currentBundle.question.id} />
              <input type="hidden" name="redirectTo" value="/practice" />
              <button className="secondary-button danger-button" type="submit">
                Unpublish Question
              </button>
            </form>
          </div>

          <div className="result-banner" aria-live="polite">
            <strong>
              {submitted
                ? isQuestionCorrect(currentBundle, lockedResponse)
                  ? "Correct"
                  : "Incorrect"
                : currentBundle.question.questionType === "hazard_prediction"
                  ? "Complete all statements"
                  : "Choose one answer"}
            </strong>
            <span>{currentBundle.category.labelEn}</span>
            <span>
              {submitted
                ? currentBundle.question.questionType === "hazard_prediction"
                  ? "All three statements must be correct."
                  : singleChoiceResponse
                    ? `Selected ${singleChoiceResponse.selectedChoiceKey}`
                    : "No answer selected yet"
                : currentBundle.question.questionType === "hazard_prediction"
                  ? "True / False for each statement"
                  : "No answer selected yet"}
            </span>
          </div>
        </article>

        <aside className="study-side-stack">
          <article className="surface-card study-support-card study-sticky-card">
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
                Submit your answer first. The explanation stays in this side panel so the next question remains in view.
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
          <dt>Earned points</dt>
          <dd>
            {summary.earnedPoints} / {summary.possiblePoints}
          </dd>
        </div>
        <div>
          <dt>Fully correct items</dt>
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
            <strong>{item.accuracyPercent}% accuracy</strong>
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
            setCurrentIndex(0);
            setDraftResponse(undefined);
            setSubmitted(false);
            setCompleted(false);
          }}
        >
          Back to Setup
        </button>
      </div>
    </article>
  ) : null;
}
