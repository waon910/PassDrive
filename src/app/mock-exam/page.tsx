import { AppShell } from "@/components/app-shell";
import { StatGrid } from "@/components/stat-grid";
import { MockExamRunner } from "@/features/mock-exam/components/mock-exam-runner";
import { getMockExamViewModel } from "@/features/mock-exam/get-mock-exam-view-model";

export default async function MockExamPage() {
  const viewModel = await getMockExamViewModel();

  return (
    <AppShell
      currentPath="/mock-exam"
      eyebrow="Mock Exam"
      title="Use a stricter flow when you want a real readiness signal."
      description="Mock exam mode should feel more serious than practice: stable timing, clear thresholds, and no early explanation leaks."
      meta={
        <div className="hero-meta-stack">
          <div className="hero-meta-card">
            <span className="meta-label">Target score</span>
            <strong>{viewModel.setup.passThresholdPercent}%</strong>
          </div>
          <div className="hero-meta-card">
            <span className="meta-label">Time limit</span>
            <strong>{viewModel.setup.timeLimitMinutes} min</strong>
          </div>
        </div>
      }
    >
      <StatGrid
        items={[
          { label: "Exam questions", value: viewModel.setup.questionCount },
          { label: "Time limit", value: `${viewModel.setup.timeLimitMinutes} min` },
          { label: "Pass line", value: `${viewModel.setup.passThresholdPercent}%` },
          {
            label: "Latest result",
            value: viewModel.latestMockExam?.result ?? "n/a"
          }
        ]}
      />

      <section className="two-column-grid mock-exam-layout">
        <MockExamRunner
          questionBundles={viewModel.examQuestionBundles}
          passThresholdPercent={viewModel.setup.passThresholdPercent}
          timeLimitMinutes={viewModel.setup.timeLimitMinutes}
        />

        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Latest Exam</p>
              <h2>Most recent outcome</h2>
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
              <dt>Questions answered</dt>
              <dd>{viewModel.latestMockExam?.questionCount ?? "n/a"}</dd>
            </div>
            <div>
              <dt>Correct answers</dt>
              <dd>{viewModel.latestMockExam?.correctCount ?? "n/a"}</dd>
            </div>
            <div>
              <dt>Pass line</dt>
              <dd>
                {viewModel.latestMockExam?.passThresholdPercent !== undefined
                  ? `${viewModel.latestMockExam.passThresholdPercent}%`
                  : "n/a"}
              </dd>
            </div>
          </dl>

          <div className="panel-head">
            <div>
              <p className="eyebrow">Category Readiness</p>
              <h2>What still needs work</h2>
            </div>
          </div>

          <div className="stack-list">
            {viewModel.categoryProgress.map((item) => (
              <div key={item.category.id} className="list-card">
                <div>
                  <span>{item.category.labelEn}</span>
                  <small>{item.needsReviewCount} item(s) still need review</small>
                </div>
                <strong>{item.accuracyPercent}%</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
