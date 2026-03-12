import { AppShell } from "@/components/app-shell";
import { HomeNextStepPanel } from "@/features/home/components/home-next-step-panel";
import { getHomeViewModel } from "@/features/home/get-home-view-model";

export default async function HomePage() {
  const viewModel = await getHomeViewModel();

  return (
    <AppShell
      currentPath="/"
      eyebrow="Home"
      title="Study"
      description="Pick one next step."
      meta={
        <div className="hero-meta-stack">
          <div className="hero-meta-card">
            <span className="meta-label">Weakest area</span>
            <strong>{viewModel.weakestCategory?.category.labelEn ?? "n/a"}</strong>
          </div>
        </div>
      }
    >
      <HomeNextStepPanel
        baseCategoryProgress={viewModel.categoryProgress}
        baseUserProgress={viewModel.baseUserProgress}
        featuredQuestion={viewModel.featuredQuestion}
        latestMockExam={viewModel.latestMockExam}
        overview={viewModel.overview}
        publishedQuestionBundles={viewModel.publishedQuestionBundles}
        totalAttempts={viewModel.totalAttempts}
        totalCorrect={viewModel.totalCorrect}
      />
    </AppShell>
  );
}
