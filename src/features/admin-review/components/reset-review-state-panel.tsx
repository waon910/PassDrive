"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { resetAdminReviewStateAction } from "@/features/admin-review/review-actions";
import { resetLearnerHistorySnapshot } from "@/lib/learner-history-store";

interface ResetReviewStatePanelProps {
  canReset: boolean;
}

export function ResetReviewStatePanel({ canReset }: ResetReviewStatePanelProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeDialog() {
    if (isPending) {
      return;
    }

    setIsDialogOpen(false);
  }

  function handleReset() {
    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          await resetLearnerHistorySnapshot();
          await resetAdminReviewStateAction();
          setIsDialogOpen(false);
          router.refresh();
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to reset review state.");
        }
      })();
    });
  }

  return (
    <>
      <article className="surface-card admin-reset-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Reset State</p>
            <h2>Clear all progress and review decisions.</h2>
          </div>
          <span className="chip">Danger zone</span>
        </div>

        <p className="small-copy">
          This resets content review statuses, publication flags, sample progress records, and the saved learner
          history in this browser.
        </p>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <div className="action-row">
          <button className="secondary-button danger-button" type="button" onClick={() => setIsDialogOpen(true)} disabled={!canReset}>
            Reset All Progress and Reviews
          </button>
        </div>

        {!canReset ? (
          <p className="small-copy">Reset is unavailable while the content store is read-only on this deployment.</p>
        ) : null}
      </article>

      {isDialogOpen ? (
        <div className="admin-confirm-backdrop" role="presentation">
          <div className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="reset-admin-state-title">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Confirm Reset</p>
                <h2 id="reset-admin-state-title">This cannot be undone.</h2>
              </div>
            </div>

            <p className="small-copy">
              All review approvals, publish states, sample progress, and local learner history on this device will be
              cleared.
            </p>

            <div className="action-row">
              <button className="secondary-button" type="button" onClick={closeDialog} disabled={isPending}>
                Cancel
              </button>
              <button className="secondary-button danger-button" type="button" onClick={handleReset} disabled={isPending}>
                {isPending ? "Resetting..." : "Yes, Reset Everything"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
