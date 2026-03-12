import { AppShell } from "@/components/app-shell";
import { ProgressFocusPanel } from "@/features/progress/components/progress-focus-panel";
import { getProgressViewModel } from "@/features/progress/get-progress-view-model";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const viewModel = await getProgressViewModel();

  return (
    <AppShell
      currentPath="/progress"
      eyebrow="Progress"
      title="Progress"
      description="See the next weak area."
      meta={
        <div className="hero-meta-stack">
          <div className="hero-meta-card">
            <span className="meta-label">Overall accuracy</span>
            <strong>{viewModel.overallAccuracyPercent}%</strong>
          </div>
          <div className="hero-meta-card">
            <span className="meta-label">Latest mock</span>
            <strong>
              {viewModel.latestMockExam?.scorePercent !== undefined ? `${viewModel.latestMockExam.scorePercent}%` : "n/a"}
            </strong>
          </div>
        </div>
      }
    >
      <ProgressFocusPanel
        baseCategoryProgress={viewModel.categoryProgress}
        baseUserProgress={viewModel.baseUserProgress}
        latestMockExam={viewModel.latestMockExam}
        publishedQuestionBundles={viewModel.publishedQuestionBundles}
        totalAttempts={viewModel.totalAttempts}
        totalCorrect={viewModel.totalCorrect}
      />
    </AppShell>
  );
}
