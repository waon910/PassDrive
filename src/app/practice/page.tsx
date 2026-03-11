import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { getPracticeViewModel } from "@/features/practice/get-practice-view-model";

export default async function PracticePage() {
  const viewModel = await getPracticeViewModel();

  return (
    <AppShell
      currentPath="/practice"
      eyebrow="Practice Setup"
      title="Choose one practice mode and start."
      description="This screen is only for selecting how you want to study next. The answering flow begins on the next screen."
    >
      <section className="single-column-grid">
        <article className="surface-card focus-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Random Practice</p>
              <h2>Take a mixed set from the current published questions.</h2>
            </div>
            <span className="chip">{viewModel.availableQuestionCount} questions</span>
          </div>

          <p className="small-copy">
            Use this when you want a broad recall check without thinking about categories first.
          </p>

          <div className="action-row">
            <Link className="primary-button link-button" href="/practice/session?mode=random">
              Start Random Set
            </Link>
          </div>
        </article>

        <article className="surface-card focus-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">By Category</p>
              <h2>Target a single weak area.</h2>
            </div>
          </div>

          <div className="stack-list">
            {viewModel.categoryProgress.map((item) => (
              <div key={item.category.id} className="list-card">
                <div>
                  <span>{item.category.labelEn}</span>
                  <small>
                    {item.questionCount} question(s) · {item.accuracyPercent}% current accuracy
                  </small>
                </div>
                <Link
                  className="secondary-button link-button"
                  href={`/practice/session?mode=category&category=${item.category.id}`}
                >
                  Start
                </Link>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card focus-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Mistakes First</p>
              <h2>Retry only questions that already caused errors.</h2>
            </div>
            <span className="chip">{viewModel.mistakeQuestionIds.length} items</span>
          </div>

          <p className="small-copy">
            Use this when you want the shortest path to score recovery before a mock exam.
          </p>

          <div className="action-row">
            <Link className="primary-button link-button" href="/practice/session?mode=mistakes">
              Review Mistakes
            </Link>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
