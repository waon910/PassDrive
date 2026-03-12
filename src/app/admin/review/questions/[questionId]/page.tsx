import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { QuestionReviewShell } from "@/features/admin-review/components/question-review-shell";
import { getQuestionReviewViewModel } from "@/features/admin-review/get-question-review-view-model";

export const dynamic = "force-dynamic";

interface QuestionReviewPageProps {
  params: Promise<{
    questionId: string;
  }>;
}

export default async function QuestionReviewPage({ params }: QuestionReviewPageProps) {
  const { questionId } = await params;
  const viewModel = await getQuestionReviewViewModel(questionId);

  if (!viewModel) {
    notFound();
  }

  return (
    <AppShell
      currentPath="/admin/review"
      eyebrow="Admin Review"
      title="Question Detail"
      description="Check one question and adjust learner visibility."
      meta={
        <div className="hero-meta-stack">
          <div className="hero-meta-card">
            <span className="meta-label">Question</span>
            <strong>{viewModel.bundle.question.id}</strong>
          </div>
          <div className="hero-meta-card">
            <span className="meta-label">Category</span>
            <strong>{viewModel.bundle.category.labelEn}</strong>
          </div>
        </div>
      }
    >
      <QuestionReviewShell viewModel={viewModel} />
    </AppShell>
  );
}
