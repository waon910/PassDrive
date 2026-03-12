import { ReviewStatusSummary } from "@/features/admin-review/components/review-status-summary";
import { ReviewQueueList } from "@/features/admin-review/components/review-queue-list";
import type { ReviewDashboardViewModel } from "@/features/admin-review/get-review-dashboard-view-model";

interface ReviewDashboardProps {
  viewModel: ReviewDashboardViewModel;
}

export function ReviewDashboard({ viewModel }: ReviewDashboardProps) {
  return (
    <section className="single-column-grid">
      <ReviewStatusSummary summary={viewModel.summary} />
      <ReviewQueueList items={viewModel.items} />
    </section>
  );
}
