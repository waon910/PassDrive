import { AppShell } from "@/components/app-shell";
import { getPracticeViewModel } from "@/features/practice/get-practice-view-model";
import { PracticeRunner } from "@/features/practice/components/practice-runner";

export default async function PracticeSessionPage() {
  const viewModel = await getPracticeViewModel();

  return (
    <AppShell
      currentPath="/practice"
      eyebrow="Practice Session"
      title="Answer one question at a time."
      description="This screen is only for answering and immediate explanation. Change mode or category from the practice setup screen."
    >
      <PracticeRunner
        questionBundles={viewModel.questionBundles}
        categoryProgress={viewModel.categoryProgress}
        mistakeQuestionIds={viewModel.mistakeQuestionIds}
      />
    </AppShell>
  );
}
