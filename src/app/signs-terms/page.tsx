import { AppShell } from "@/components/app-shell";
import { StatGrid } from "@/components/stat-grid";
import { getSignsTermsViewModel } from "@/features/signs-terms/get-signs-terms-view-model";

export default async function SignsTermsPage() {
  const viewModel = await getSignsTermsViewModel();

  return (
    <AppShell
      currentPath="/signs-terms"
      eyebrow="Signs & Terms"
      title="Keep definitions easy to find while studying."
      description="This space supports reading, not guessing. In the iPad layout, definitions should stay visible without making the learner lose place."
    >
      <StatGrid
        items={[
          { label: "Glossary terms", value: viewModel.glossaryDetails.length },
          { label: "Featured topic", value: viewModel.featuredTerm?.term.termEn ?? "n/a" },
          { label: "Categories linked", value: viewModel.glossaryDetails.filter((item) => item.category).length },
          { label: "Layout mode", value: "Split-view ready" }
        ]}
      />

      <section className="two-column-grid">
        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Featured Term</p>
              <h2>{viewModel.featuredTerm?.term.termEn ?? "No term"}</h2>
            </div>
          </div>

          <p className="question-stem">{viewModel.featuredTerm?.term.shortDefinitionEn ?? "No term available."}</p>
          <p className="small-copy">{viewModel.featuredTerm?.term.longExplanationEn ?? ""}</p>
          <p className="small-copy">
            Category: {viewModel.featuredTerm?.category?.labelEn ?? "General"}
          </p>
        </article>

        <article className="surface-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Reference List</p>
              <h2>Terms in the current dataset</h2>
            </div>
          </div>

          <div className="stack-list">
            {viewModel.glossaryDetails.map((item) => (
              <div key={item.term.id} className="list-card">
                <div>
                  <span>{item.term.termEn}</span>
                  <small>{item.term.shortDefinitionEn}</small>
                </div>
                <strong>{item.category?.labelEn ?? "General"}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
