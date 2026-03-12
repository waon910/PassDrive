import { AppShell } from "@/components/app-shell";
import { SignsTermsBrowser } from "@/features/signs-terms/components/signs-terms-browser";
import { getSignsTermsViewModel } from "@/features/signs-terms/get-signs-terms-view-model";

export const dynamic = "force-dynamic";

export default async function SignsTermsPage() {
  const viewModel = await getSignsTermsViewModel();

  return (
    <AppShell
      currentPath="/signs-terms"
      eyebrow="Signs & Terms"
      title="Signs & Terms"
      description="Clarify a term, then return."
      shellVariant="study"
    >
      <section className="signs-page-stack">
        <article className="surface-card signs-overview-bar">
          <div className="signs-overview-copy">
            <p className="eyebrow">Signs & Terms</p>
            <h1>Signs & Terms</h1>
            <p className="small-copy">Search fast, compare signs, then return to study.</p>
          </div>

          <div className="signs-overview-stats" aria-label="Signs and terms summary">
            <div className="signs-overview-stat">
              <span className="meta-label">Traffic signs</span>
              <strong>{viewModel.trafficSignCount}</strong>
            </div>
            <div className="signs-overview-stat">
              <span className="meta-label">Study terms</span>
              <strong>{viewModel.termCount}</strong>
            </div>
            <div className="signs-overview-stat">
              <span className="meta-label">Total items</span>
              <strong>{viewModel.glossaryDetails.length}</strong>
            </div>
          </div>
        </article>

        <SignsTermsBrowser glossaryDetails={viewModel.glossaryDetails} />
      </section>
    </AppShell>
  );
}
