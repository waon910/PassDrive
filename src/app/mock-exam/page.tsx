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
      description="Run a timed final-test practice set with standard and hazard prediction items."
      shellVariant="study"
    >
      <MockExamRunner
        standardQuestionBundles={viewModel.standardQuestionBundles}
        hazardQuestionBundles={viewModel.hazardQuestionBundles}
        standardQuestionCount={viewModel.setup.standardQuestionCount}
        hazardQuestionCount={viewModel.setup.hazardQuestionCount}
        passThresholdPercent={viewModel.setup.passThresholdPercent}
        timeLimitMinutes={viewModel.setup.timeLimitMinutes}
      />
    </AppShell>
  );
}
