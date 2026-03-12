import { ReviewStatusSummary } from "@/features/admin-review/components/review-status-summary";
import { ReviewQueueList } from "@/features/admin-review/components/review-queue-list";
import { ResetReviewStatePanel } from "@/features/admin-review/components/reset-review-state-panel";
import type { ReviewDashboardViewModel } from "@/features/admin-review/get-review-dashboard-view-model";

interface ReviewDashboardProps {
  viewModel: ReviewDashboardViewModel;
}

export function ReviewDashboard({ viewModel }: ReviewDashboardProps) {
  return (
    <section className="single-column-grid">
      {!viewModel.contentStore.runtimeWritable ? (
        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Storage Mode</p>
              <h2>Review actions are read-only on this deployment.</h2>
            </div>
            <span className="chip">File store</span>
          </div>

          <p className="small-copy">
            This app is still using file-backed content storage. On Vercel, review and publish updates will not persist
            until the admin workflow moves to a database-backed store.
          </p>
        </article>
      ) : null}
      <ReviewStatusSummary summary={viewModel.summary} />
      <ReviewQueueList items={viewModel.items} />
      <ResetReviewStatePanel canReset={viewModel.contentStore.runtimeWritable} />
    </section>
  );
}
