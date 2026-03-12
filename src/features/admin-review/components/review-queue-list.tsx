import Link from "next/link";

import { formatReviewStatusLabel, formatRightsStatusLabel } from "@/domain/content-rules";
import { formatReviewQueueStageLabel } from "@/domain/review-rules";
import type { ReviewDashboardItem } from "@/features/admin-review/get-review-dashboard-view-model";

interface ReviewQueueListProps {
  items: ReviewDashboardItem[];
}

export function ReviewQueueList({ items }: ReviewQueueListProps) {
  return (
    <article className="surface-card">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Review Queue</p>
          <h2>Open one item and move it forward.</h2>
        </div>
        <span className="chip">{items.length} total</span>
      </div>

      <div className="stack-list">
        {items.map((item) => (
          <Link
            key={item.bundle.question.id}
            className="list-card admin-review-row"
            href={`/admin/review/questions/${item.bundle.question.id}`}
          >
            <div className="admin-review-primary">
              <span>{item.bundle.question.englishStem}</span>
              <small>
                {item.bundle.category.labelEn}
                {" · "}
                {item.bundle.question.id}
              </small>
            </div>

            <dl className="admin-review-meta">
              <div>
                <dt>Rights</dt>
                <dd>{formatRightsStatusLabel(item.bundle.sourceReference.rightsStatus)}</dd>
              </div>
              <div>
                <dt>Translation</dt>
                <dd>{formatReviewStatusLabel(item.bundle.question.translationReviewStatus)}</dd>
              </div>
              <div>
                <dt>Explanation</dt>
                <dd>{formatReviewStatusLabel(item.bundle.question.explanationReviewStatus)}</dd>
              </div>
              <div>
                <dt>Overall</dt>
                <dd>{formatReviewQueueStageLabel(item.stage)}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </article>
  );
}
