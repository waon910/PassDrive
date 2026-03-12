import { AppShell } from "@/components/app-shell";
import { MockExamRunner } from "@/features/mock-exam/components/mock-exam-runner";
import { getMockExamViewModel } from "@/features/mock-exam/get-mock-exam-view-model";

export default async function MockExamPage() {
  const viewModel = await getMockExamViewModel();

  return (
    <AppShell
      currentPath="/mock-exam"
      eyebrow="Mock Exam"
      title="Mock Exam"
      description="Start the timer. Finish the set. Review the result."
      meta={
        <div className="hero-meta-stack">
          <div className="hero-meta-card">
            <span className="meta-label">Target score</span>
            <strong>{viewModel.setup.passThresholdPercent}%</strong>
          </div>
          <div className="hero-meta-card">
            <span className="meta-label">Time limit</span>
            <strong>{viewModel.setup.timeLimitMinutes} min</strong>
          </div>
        </div>
      }
    >
      <MockExamRunner
        questionBundles={viewModel.examQuestionBundles}
        passThresholdPercent={viewModel.setup.passThresholdPercent}
        timeLimitMinutes={viewModel.setup.timeLimitMinutes}
      />
    </AppShell>
  );
}
