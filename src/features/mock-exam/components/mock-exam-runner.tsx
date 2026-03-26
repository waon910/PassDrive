"use client";

import { useEffect, useState } from "react";

import { QuestionFigure } from "@/components/question-figure";
import { getOrderedChoices } from "@/domain/content-rules";
import {
  buildSessionSummary,
  getQuestionPromptCount,
  isResponseComplete,
  type SessionAnswerMap
} from "@/domain/session-rules";
import type { PromptChoiceKey, QuestionBundle } from "@/domain/content-types";
import { recordMockExamResult } from "@/lib/learner-history-store";

interface MockExamRunnerProps {
  standardQuestionBundles: QuestionBundle[];
  hazardQuestionBundles: QuestionBundle[];
  standardQuestionCount: number;
  hazardQuestionCount: number;
  passThresholdPercent: number;
  timeLimitMinutes: number;
}

function shuffleBundles(bundles: QuestionBundle[]) {
  const next = [...bundles];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function buildVisibleQuestionIndices(currentIndex: number, totalQuestions: number) {
  if (totalQuestions === 0) {
    return [];
  }

  const visibleIndices = new Set<number>([0, totalQuestions - 1]);

  for (let index = currentIndex - 1; index <= currentIndex + 1; index += 1) {
    if (index >= 0 && index < totalQuestions) {
      visibleIndices.add(index);
    }
  }

  return [...visibleIndices].sort((left, right) => left - right);
}

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function buildExamBundleSet(
  standardQuestionBundles: QuestionBundle[],
  hazardQuestionBundles: QuestionBundle[],
  standardQuestionCount: number,
  hazardQuestionCount: number
) {
  return [
    ...shuffleBundles(standardQuestionBundles).slice(0, standardQuestionCount),
    ...shuffleBundles(hazardQuestionBundles).slice(0, hazardQuestionCount)
  ];
}

function countAnsweredQuestions(questionBundles: QuestionBundle[], answers: SessionAnswerMap) {
  return questionBundles.reduce((total, bundle) => total + (isResponseComplete(bundle, answers[bundle.question.id]) ? 1 : 0), 0);
}

function getSelectedChoiceLabel(isSelected: boolean) {
  return isSelected ? "Selected" : undefined;
}

export function MockExamRunner({
  standardQuestionBundles,
  hazardQuestionBundles,
  standardQuestionCount,
  hazardQuestionCount,
  passThresholdPercent,
  timeLimitMinutes
}: MockExamRunnerProps) {
  const initialSeconds = timeLimitMinutes * 60;
  const initialPossiblePoints = standardQuestionCount + hazardQuestionCount * 2;
  const passThresholdPoints = Math.ceil((initialPossiblePoints * passThresholdPercent) / 100);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [sessionBundles, setSessionBundles] = useState<QuestionBundle[]>([]);
  const [answers, setAnswers] = useState<SessionAnswerMap>({});

  useEffect(() => {
    if (!started || completed) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, completed]);

  useEffect(() => {
    if (started && !completed && remainingSeconds === 0) {
      finishExam();
    }
  }, [started, completed, remainingSeconds]);

  const currentBundle = sessionBundles[currentIndex];
  const summary = completed ? buildSessionSummary(sessionBundles, answers, passThresholdPercent) : null;
  const answeredCount = countAnsweredQuestions(sessionBundles, answers);
  const visibleQuestionIndices = buildVisibleQuestionIndices(currentIndex, sessionBundles.length);

  function startExam() {
    const nextBundles = buildExamBundleSet(
      standardQuestionBundles,
      hazardQuestionBundles,
      standardQuestionCount,
      hazardQuestionCount
    );

    setSessionBundles(nextBundles);
    setStarted(true);
    setCompleted(false);
    setCurrentIndex(0);
    setRemainingSeconds(initialSeconds);
    setAnswers({});
  }

  function finishExam() {
    const nextSummary = buildSessionSummary(sessionBundles, answers, passThresholdPercent);

    setCompleted(true);
    setStarted(false);
    void recordMockExamResult(sessionBundles, answers, nextSummary, passThresholdPercent);
  }

  function resetExam() {
    setCompleted(false);
    setStarted(false);
    setCurrentIndex(0);
    setRemainingSeconds(initialSeconds);
    setSessionBundles([]);
    setAnswers({});
  }

  function selectChoice(questionId: string, choiceKey: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: {
        kind: "single_choice",
        selectedChoiceKey: choiceKey
      }
    }));
  }

  function selectPromptChoice(questionId: string, promptKey: string, choiceKey: PromptChoiceKey) {
    setAnswers((currentAnswers) => {
      const currentResponse = currentAnswers[questionId];
      const promptChoiceKeys = currentResponse?.kind === "hazard_prediction" ? currentResponse.promptChoiceKeys : {};

      return {
        ...currentAnswers,
        [questionId]: {
          kind: "hazard_prediction",
          promptChoiceKeys: {
            ...promptChoiceKeys,
            [promptKey]: choiceKey
          }
        }
      };
    });
  }

  return (
    <>
      {!started && !completed ? (
        <section className="study-setup-layout">
          <article className="surface-card focus-card mock-exam-runner">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Exam Setup</p>
                <h2>Run a practice set shaped like the real final written test.</h2>
              </div>
              <span className="chip">{standardQuestionCount + hazardQuestionCount} items</span>
            </div>

            <dl className="detail-list">
              <div>
                <dt>Standard questions</dt>
                <dd>{standardQuestionCount} true / false</dd>
              </div>
              <div>
                <dt>Hazard prediction</dt>
                <dd>{hazardQuestionCount} items x 2 pts</dd>
              </div>
              <div>
                <dt>Time limit</dt>
                <dd>{timeLimitMinutes} min</dd>
              </div>
              <div>
                <dt>Pass line</dt>
                <dd>
                  {passThresholdPoints} / {initialPossiblePoints} pts
                </dd>
              </div>
            </dl>

            <p className="small-copy">
              This mock exam matches the real final written test format: 90 true / false questions plus 5 hazard prediction
              items, 50 minutes, and a 90-point pass line.
            </p>

            <div className="action-row">
              <button
                className="primary-button"
                type="button"
                onClick={startExam}
                disabled={standardQuestionCount === 0 || hazardQuestionCount === 0}
              >
                Start Mock Exam
              </button>
            </div>
          </article>

          <aside className="study-side-stack">
            <article className="surface-card study-support-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Scoring Rules</p>
                  <h2>Hazard prediction stays all-or-nothing.</h2>
                </div>
              </div>

              <div className="compact-metrics">
                <div className="compact-metric">
                  <span>Total points</span>
                  <strong>{initialPossiblePoints}</strong>
                </div>
                <div className="compact-metric">
                  <span>Pass line</span>
                  <strong>{passThresholdPercent}%</strong>
                </div>
                <div className="compact-metric">
                  <span>Hazard rule</span>
                  <strong>3 correct for 2 pts</strong>
                </div>
              </div>
            </article>
          </aside>
        </section>
      ) : null}

      {started && currentBundle ? (
        <section className="study-session-layout">
          <article className="surface-card focus-card study-main-card mock-exam-runner">
            <div className="panel-head">
              <div>
                <p className="eyebrow">
                  {currentBundle.question.questionType === "hazard_prediction" ? "Hazard Prediction" : "Exam in Progress"}
                </p>
                <h2>{currentBundle.category.labelEn}</h2>
              </div>
              <div className="timer-badge">{formatRemainingTime(remainingSeconds)}</div>
            </div>

            <div className="study-status-row" aria-label="Mock exam status">
              <span className="home-highlight-chip">
                Item {currentIndex + 1} / {sessionBundles.length}
              </span>
              <span className="home-highlight-chip">{answeredCount} answered</span>
              <span className="home-highlight-chip">
                {getQuestionPromptCount(currentBundle)} {currentBundle.question.questionType === "hazard_prediction" ? "statements" : "choices"}
              </span>
            </div>

            {currentBundle.question.hasImage ? <QuestionFigure question={currentBundle.question} /> : null}

            <p className="question-stem">{currentBundle.question.englishStem}</p>

            {currentBundle.question.questionType === "hazard_prediction" ? (
              <div className="hazard-prompt-list">
                <p className="small-copy">
                  Choose true or false for all three statements. You earn 2 points only if all three are correct.
                </p>

                {currentBundle.questionPrompts.map((prompt) => {
                  const questionResponse = answers[currentBundle.question.id];
                  const currentResponse = questionResponse?.kind === "hazard_prediction" ? questionResponse : undefined;
                  const selectedChoiceKey = currentResponse?.promptChoiceKeys[prompt.promptKey];

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
                          const stateLabel = getSelectedChoiceLabel(isSelected);

                          return (
                            <button
                              key={choiceKey}
                              className={isSelected ? "choice-button selected hazard-choice-button" : "choice-button hazard-choice-button"}
                              type="button"
                              onClick={() => selectPromptChoice(currentBundle.question.id, prompt.promptKey, choiceKey)}
                              aria-pressed={isSelected}
                            >
                              <span className="choice-key">{choiceKey === "T" ? "True" : "False"}</span>
                              {stateLabel ? <span className="choice-state-badge selected">{stateLabel}</span> : null}
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="choice-stack" role="radiogroup" aria-label="Mock exam answer choices">
                {getOrderedChoices(currentBundle.question, currentBundle.choices).map((choice) => {
                  const questionResponse = answers[currentBundle.question.id];
                  const currentResponse = questionResponse?.kind === "single_choice" ? questionResponse : undefined;
                  const isSelected = currentResponse?.selectedChoiceKey === choice.choiceKey;
                  const stateLabel = getSelectedChoiceLabel(isSelected);

                  return (
                    <button
                      key={choice.id}
                      className={isSelected ? "choice-button selected" : "choice-button"}
                      type="button"
                      onClick={() => selectChoice(currentBundle.question.id, choice.choiceKey)}
                      aria-pressed={isSelected}
                    >
                      <span className="choice-key">{choice.choiceKey}</span>
                      <span className="choice-copy">
                        <span className="choice-text">{choice.englishText}</span>
                        {stateLabel ? <span className="choice-state-badge selected">{stateLabel}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="exam-actions study-action-bar">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
                disabled={currentIndex === 0}
              >
                Previous
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setCurrentIndex((value) => Math.min(sessionBundles.length - 1, value + 1))}
                disabled={currentIndex === sessionBundles.length - 1}
              >
                Next
              </button>
              <button className="primary-button" type="button" onClick={finishExam}>
                Finish Exam
              </button>
            </div>
          </article>

          <aside className="study-side-stack">
            <article className="surface-card study-support-card study-sticky-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Question Navigator</p>
                  <h2>Keep the exam order stable from start to finish.</h2>
                </div>
              </div>

              <div className="compact-metrics">
                <div className="compact-metric">
                  <span>Remaining time</span>
                  <strong>{formatRemainingTime(remainingSeconds)}</strong>
                </div>
                <div className="compact-metric">
                  <span>Pass line</span>
                  <strong>
                    {passThresholdPoints} / {initialPossiblePoints} pts
                  </strong>
                </div>
                <div className="compact-metric">
                  <span>Answered</span>
                  <strong>{answeredCount}</strong>
                </div>
              </div>

              <div className="question-index-row" aria-label="Question navigation">
                {visibleQuestionIndices.map((index, visibleIndex) => {
                  const bundle = sessionBundles[index];
                  const answered = isResponseComplete(bundle, answers[bundle.question.id]);
                  const active = index === currentIndex;
                  const previousVisibleIndex = visibleQuestionIndices[visibleIndex - 1];
                  const showGap = previousVisibleIndex !== undefined && index - previousVisibleIndex > 1;

                  return (
                    <div key={bundle.question.id} className="question-index-group">
                      {showGap ? <span className="question-index-gap">...</span> : null}
                      <button
                        className={[
                          "question-index-pill",
                          answered ? "answered" : "",
                          active ? "active" : ""
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                      >
                        {index + 1}
                      </button>
                    </div>
                  );
                })}
              </div>
            </article>
          </aside>
        </section>
      ) : null}

      {completed && summary ? (
        <article className="surface-card session-summary">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Results Summary</p>
              <h2>{summary.passed ? "You passed this mock exam." : "This mock exam needs another pass."}</h2>
            </div>
            <span className={summary.passed ? "chip pass" : "chip fail"}>
              {summary.earnedPoints} / {summary.possiblePoints} pts
            </span>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Score</dt>
              <dd>{summary.scorePercent}%</dd>
            </div>
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
              <dt>Pass line</dt>
              <dd>{summary.passThresholdPoints} pts</dd>
            </div>
          </dl>

          <div className="stack-list">
            {summary.categoryBreakdown.map((item) => (
              <div key={item.categoryId} className="list-card">
                <div>
                  <span>{item.categoryLabel}</span>
                  <small>
                    {item.correct} / {item.total} fully correct
                  </small>
                </div>
                <strong>
                  {item.earnedPoints} / {item.possiblePoints} pts
                </strong>
              </div>
            ))}
          </div>

          <div className="action-row">
            <button className="primary-button" type="button" onClick={startExam}>
              Take Another Mock Exam
            </button>
            <button className="secondary-button" type="button" onClick={resetExam}>
              Back to Setup
            </button>
          </div>
        </article>
      ) : null}
    </>
  );
}
