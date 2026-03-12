import { AppShell } from "@/components/app-shell";
import { SignsTermsBrowser } from "@/features/signs-terms/components/signs-terms-browser";
import { getSignsTermsViewModel } from "@/features/signs-terms/get-signs-terms-view-model";

export default async function SignsTermsPage() {
  const viewModel = await getSignsTermsViewModel();

  return (
    <AppShell
      currentPath="/signs-terms"
      eyebrow="Signs & Terms"
      title="Signs & Terms"
      description="Clarify a term, then return."
      meta={
        <div className="hero-meta-stack">
          <div className="hero-meta-card">
            <span className="meta-label">Glossary terms</span>
            <strong>{viewModel.glossaryDetails.length}</strong>
          </div>
        </div>
      }
    >
      <SignsTermsBrowser glossaryDetails={viewModel.glossaryDetails} />
    </AppShell>
  );
}
