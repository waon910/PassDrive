import { AppShell } from "@/components/app-shell";
import { MistakesReviewList } from "@/features/mistakes/components/mistakes-review-list";
import { getMistakesViewModel } from "@/features/mistakes/get-mistakes-view-model";

export default async function MistakesPage() {
  const viewModel = await getMistakesViewModel();

  return (
    <AppShell
      currentPath="/mistakes"
      eyebrow="Mistakes"
      title="Mistakes"
      description="Review only what you missed."
      meta={
        <div className="hero-meta-stack">
          <div className="hero-meta-card">
            <span className="meta-label">Items to review</span>
            <strong>{viewModel.mistakeBundles.length}</strong>
          </div>
        </div>
      }
    >
      <MistakesReviewList
        allQuestionBundles={viewModel.allQuestionBundles}
        baseMistakeBundles={viewModel.mistakeBundles}
        totalMistakeCount={viewModel.totalMistakeCount}
      />
    </AppShell>
  );
}
