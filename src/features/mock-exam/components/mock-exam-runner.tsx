"use client";

import { useEffect, useState } from "react";

import { QuestionFigure } from "@/components/question-figure";
import { buildSessionSummary } from "@/domain/session-rules";
import type { QuestionBundle } from "@/domain/content-types";
import { recordMockExamResult } from "@/lib/learner-history-store";

interface MockExamRunnerProps {
  questionBundles: QuestionBundle[];
  passThresholdPercent: number;
  timeLimitMinutes: number;
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

export function MockExamRunner({
  questionBundles,
  passThresholdPercent,
  timeLimitMinutes
}: MockExamRunnerProps) {
  const initialSeconds = timeLimitMinutes * 60;
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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

  const currentBundle = questionBundles[currentIndex];
  const summary = completed ? buildSessionSummary(questionBundles, answers, passThresholdPercent) : null;
  const answeredCount = Object.keys(answers).length;
  const visibleQuestionIndices = buildVisibleQuestionIndices(currentIndex, questionBundles.length);

  function startExam() {
    setStarted(true);
    setCompleted(false);
    setCurrentIndex(0);
    setRemainingSeconds(initialSeconds);
    setAnswers({});
  }

  function finishExam() {
    const nextSummary = buildSessionSummary(questionBundles, answers, passThresholdPercent);

    setCompleted(true);
    setStarted(false);
    void recordMockExamResult(questionBundles, answers, nextSummary, passThresholdPercent);
  }

  function resetExam() {
    setCompleted(false);
    setStarted(false);
    setCurrentIndex(0);
    setRemainingSeconds(initialSeconds);
    setAnswers({});
  }

  return (
    <>
      {!started && !completed ? (
        <section className="study-setup-layout">
          <article className="surface-card focus-card mock-exam-runner">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Exam Setup</p>
                <h2>Start a timed set without extra decisions.</h2>
              </div>
              <span className="chip">{questionBundles.length} questions</span>
            </div>

            <dl className="detail-list">
              <div>
                <dt>Question count</dt>
                <dd>{questionBundles.length}</dd>
              </div>
              <div>
                <dt>Time limit</dt>
                <dd>{timeLimitMinutes} min</dd>
              </div>
              <div>
                <dt>Pass threshold</dt>
                <dd>{passThresholdPercent}%</dd>
              </div>
            </dl>

            <p className="small-copy">Explanations stay hidden until the end.</p>

            <div className="action-row">
              <button className="primary-button" type="button" onClick={startExam} disabled={questionBundles.length === 0}>
                Start Mock Exam
              </button>
            </div>
          </article>

          <aside className="study-side-stack">
            <article className="surface-card study-support-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Exam Rules</p>
                  <h2>Keep timing and scoring visible from the start.</h2>
                </div>
              </div>

              <div className="compact-metrics">
                <div className="compact-metric">
                  <span>Time limit</span>
                  <strong>{timeLimitMinutes} min</strong>
                </div>
                <div className="compact-metric">
                  <span>Pass line</span>
                  <strong>{passThresholdPercent}%</strong>
                </div>
                <div className="compact-metric">
                  <span>Question count</span>
                  <strong>{questionBundles.length}</strong>
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
                <p className="eyebrow">Exam in Progress</p>
                <h2>{currentBundle.category.labelEn}</h2>
              </div>
              <div className="timer-badge">{formatRemainingTime(remainingSeconds)}</div>
            </div>

            <div className="study-status-row" aria-label="Mock exam status">
              <span className="home-highlight-chip">
                Question {currentIndex + 1} / {questionBundles.length}
              </span>
              <span className="home-highlight-chip">{answeredCount} answered</span>
              <span className="home-highlight-chip">Pass line {passThresholdPercent}%</span>
            </div>

            <p className="question-stem">{currentBundle.question.englishStem}</p>

            {currentBundle.question.hasImage ? <QuestionFigure question={currentBundle.question} /> : null}

            <div className="choice-stack" role="radiogroup" aria-label="Mock exam answer choices">
              {currentBundle.choices.map((choice) => {
                const isSelected = answers[currentBundle.question.id] === choice.choiceKey;

                return (
                  <button
                    key={choice.id}
                    className={isSelected ? "choice-button selected" : "choice-button"}
                    type="button"
                    onClick={() =>
                      setAnswers((currentAnswers) => ({
                        ...currentAnswers,
                        [currentBundle.question.id]: choice.choiceKey
                      }))
                    }
                    aria-pressed={isSelected}
                  >
                    <span className="choice-key">{choice.choiceKey}</span>
                    <span>{choice.englishText}</span>
                  </button>
                );
              })}
            </div>

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
                onClick={() => setCurrentIndex((value) => Math.min(questionBundles.length - 1, value + 1))}
                disabled={currentIndex === questionBundles.length - 1}
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
                  <h2>Move through the exam without losing your place.</h2>
                </div>
              </div>

              <div className="compact-metrics">
                <div className="compact-metric">
                  <span>Remaining time</span>
                  <strong>{formatRemainingTime(remainingSeconds)}</strong>
                </div>
                <div className="compact-metric">
                  <span>Current question</span>
                  <strong>
                    {currentIndex + 1} / {questionBundles.length}
                  </strong>
                </div>
                <div className="compact-metric">
                  <span>Answered</span>
                  <strong>{answeredCount}</strong>
                </div>
              </div>

              <div className="question-index-row" aria-label="Question navigation">
                {visibleQuestionIndices.map((index, visibleIndex) => {
                  const bundle = questionBundles[index];
                  const answered = Boolean(answers[bundle.question.id]);
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
            <span className={summary.passed ? "chip pass" : "chip fail"}>{summary.scorePercent}%</span>
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
              <dt>Unanswered</dt>
              <dd>{summary.unansweredQuestions}</dd>
            </div>
            <div>
              <dt>Pass line</dt>
              <dd>{passThresholdPercent}%</dd>
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
