import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatGrid } from "@/components/stat-grid";
import { getMistakesViewModel } from "@/features/mistakes/get-mistakes-view-model";

export default async function MistakesPage() {
  const viewModel = await getMistakesViewModel();

  return (
    <AppShell
      currentPath="/mistakes"
      eyebrow="Mistakes"
      title="Revisit the exact items that need repair."
      description="Mistakes mode should remove browsing friction. Show the weak items, keep the wording visible, and let the learner jump straight back into correction."
    >
      <StatGrid
        items={[
          { label: "Mistake count", value: viewModel.totalMistakeCount },
          { label: "Question cards", value: viewModel.mistakeBundles.length },
          { label: "Retry flow", value: "Ready" },
          { label: "Data source", value: "Local sample" }
        ]}
      />

      <section className="single-column-grid">
        {viewModel.mistakeBundles.map((bundle) => (
          <article key={bundle.question.id} className="surface-card">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Needs Review</p>
                <h2>{bundle.category.labelEn}</h2>
              </div>
              <span className="chip">Mistakes only</span>
            </div>

            <p className="question-stem">{bundle.question.englishStem}</p>
            <p className="small-copy">{bundle.explanation.bodyEn}</p>

            <div className="action-row">
              <Link className="primary-button link-button" href="/practice">
                Retry in Practice
              </Link>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
