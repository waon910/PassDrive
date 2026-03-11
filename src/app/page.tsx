import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatGrid } from "@/components/stat-grid";
import { formatQuestionTypeLabel } from "@/domain/content-rules";
import { getHomeViewModel } from "@/features/home/get-home-view-model";

export default async function HomePage() {
  const viewModel = await getHomeViewModel();

  return (
    <AppShell
      currentPath="/"
      eyebrow="Home Dashboard"
      title="Build confidence before the English written test."
      description="PassDrive keeps the next step visible: practice a question, review weak areas, and use the latest mock signal to decide what to do next."
      meta={
        <div className="hero-meta-stack">
          <div className="hero-meta-card">
            <span className="meta-label">Dataset</span>
            <strong>{viewModel.overview.datasetId}</strong>
          </div>
          <div className="hero-meta-card">
            <span className="meta-label">Weakest area</span>
            <strong>{viewModel.weakestCategory?.category.labelEn ?? "n/a"}</strong>
          </div>
        </div>
      }
    >
      <StatGrid
        items={[
          { label: "Published questions", value: viewModel.overview.publishedQuestionCount },
          { label: "Categories", value: viewModel.overview.categoryCount },
          {
            label: "Latest mock score",
            value:
              viewModel.latestMockExam?.scorePercent !== undefined ? `${viewModel.latestMockExam.scorePercent}%` : "n/a"
          },
          {
            label: "Current mastery",
            value: viewModel.featuredProgress?.masteryLevel ?? "n/a"
          }
        ]}
      />

      <section className="dashboard-grid">
        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Continue Learning</p>
              <h2>Featured practice question</h2>
            </div>
            {viewModel.featuredQuestion ? (
              <span className="chip">
                {formatQuestionTypeLabel(viewModel.featuredQuestion.question.questionType)}
              </span>
            ) : null}
          </div>

          {viewModel.featuredQuestion ? (
            <>
              <p className="question-stem">{viewModel.featuredQuestion.question.englishStem}</p>
              <p className="small-copy">
                Category: {viewModel.featuredQuestion.category.labelEn}
                {" · "}
                Attempts: {viewModel.featuredStats?.attempts ?? 0}
              </p>
            </>
          ) : (
            <p className="small-copy">No published practice question is currently available.</p>
          )}

          <div className="action-row">
            <Link className="primary-button link-button" href="/practice">
              Start Practice
            </Link>
            <Link className="secondary-button link-button" href="/mistakes">
              Review Mistakes
            </Link>
          </div>
        </article>

        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Mock Signal</p>
              <h2>Latest readiness check</h2>
            </div>
            <span className="chip">{viewModel.latestMockExam?.result ?? "n/a"}</span>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Score</dt>
              <dd>
                {viewModel.latestMockExam?.scorePercent !== undefined
                  ? `${viewModel.latestMockExam.scorePercent}%`
                  : "n/a"}
              </dd>
            </div>
            <div>
              <dt>Pass threshold</dt>
              <dd>
                {viewModel.latestMockExam?.passThresholdPercent !== undefined
                  ? `${viewModel.latestMockExam.passThresholdPercent}%`
                  : "n/a"}
              </dd>
            </div>
            <div>
              <dt>Weakest category</dt>
              <dd>{viewModel.weakestCategory?.category.labelEn ?? "n/a"}</dd>
            </div>
          </dl>

          <div className="action-row">
            <Link className="secondary-button link-button" href="/mock-exam">
              Open Mock Exam
            </Link>
          </div>
        </article>

        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Fast Routes</p>
              <h2>Study without hunting</h2>
            </div>
          </div>

          <div className="stack-list">
            <Link className="list-link" href="/progress">
              <span>Progress</span>
              <small>See accuracy and category trends</small>
            </Link>
            <Link className="list-link" href="/signs-terms">
              <span>Signs & Terms</span>
              <small>Review concepts before answering</small>
            </Link>
            <Link className="list-link" href="/mistakes">
              <span>Mistakes Only</span>
              <small>Retry what has already gone wrong</small>
            </Link>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
