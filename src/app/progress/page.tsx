import { AppShell } from "@/components/app-shell";
import { StatGrid } from "@/components/stat-grid";
import { getProgressViewModel } from "@/features/progress/get-progress-view-model";

export default async function ProgressPage() {
  const viewModel = await getProgressViewModel();

  return (
    <AppShell
      currentPath="/progress"
      eyebrow="Progress"
      title="Use progress to decide what to study next."
      description="Progress should not be a metric wall. It should show category strength, current accuracy, and the next best correction target."
    >
      <StatGrid
        items={[
          { label: "Overall accuracy", value: `${viewModel.overallAccuracyPercent}%` },
          { label: "Total attempts", value: viewModel.totalAttempts },
          {
            label: "Latest mock",
            value:
              viewModel.latestMockExam?.scorePercent !== undefined ? `${viewModel.latestMockExam.scorePercent}%` : "n/a"
          },
          { label: "Tracked categories", value: viewModel.categoryProgress.length }
        ]}
      />

      <section className="single-column-grid">
        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Category Progress</p>
              <h2>Where your score moves</h2>
            </div>
          </div>

          <div className="stack-list">
            {viewModel.categoryProgress.map((item) => (
              <div key={item.category.id} className="list-card">
                <div>
                  <span>{item.category.labelEn}</span>
                  <small>
                    {item.attempts} attempts · {item.needsReviewCount} item(s) need review
                  </small>
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
