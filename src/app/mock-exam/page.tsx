import { AppShell } from "@/components/app-shell";
import { MockExamRunner } from "@/features/mock-exam/components/mock-exam-runner";
import { getMockExamViewModel } from "@/features/mock-exam/get-mock-exam-view-model";

export const dynamic = "force-dynamic";

export default async function MockExamPage() {
  const viewModel = await getMockExamViewModel();

  return (
    <AppShell
      currentPath="/mock-exam"
      eyebrow="Mock Exam"
      title="Mock Exam"
      description="Start the timer. Finish the set. Review the result."
      shellVariant="study"
    >
      <MockExamRunner
        questionBundles={viewModel.examQuestionBundles}
        passThresholdPercent={viewModel.setup.passThresholdPercent}
        timeLimitMinutes={viewModel.setup.timeLimitMinutes}
      />
    </AppShell>
  );
}
