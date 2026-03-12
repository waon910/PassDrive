import { AppShell } from "@/components/app-shell";
import { ReviewDashboard } from "@/features/admin-review/components/review-dashboard";
import { getReviewDashboardViewModel } from "@/features/admin-review/get-review-dashboard-view-model";

export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
  const viewModel = await getReviewDashboardViewModel();

  return (
    <AppShell
      currentPath="/admin/review"
      eyebrow="Admin Review"
      title="Content Visibility"
      description="Publish or hide questions from learner-facing routes."
      meta={
        <div className="hero-meta-stack">
          <div className="hero-meta-card">
            <span className="meta-label">Questions</span>
            <strong>{viewModel.items.length}</strong>
          </div>
          <div className="hero-meta-card">
            <span className="meta-label">Published</span>
            <strong>{viewModel.summary.published}</strong>
          </div>
        </div>
      }
    >
      <ReviewDashboard viewModel={viewModel} />
    </AppShell>
  );
}
