import { AppShell } from "@/components/app-shell";
import { getPracticeViewModel } from "@/features/practice/get-practice-view-model";
import { PracticeRunner } from "@/features/practice/components/practice-runner";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const viewModel = await getPracticeViewModel();

  return (
    <AppShell
      currentPath="/practice"
      eyebrow="Practice"
      title="Practice"
      description="Choose a set. Answer. Continue."
      shellVariant="study"
    >
      <PracticeRunner
        questionBundles={viewModel.questionBundles}
        categoryProgress={viewModel.categoryProgress}
        baseUserProgress={viewModel.baseUserProgress}
        mistakeQuestionIds={viewModel.mistakeQuestionIds}
      />
    </AppShell>
  );
}
