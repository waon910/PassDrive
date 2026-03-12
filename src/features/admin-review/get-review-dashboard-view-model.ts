import type { QuestionBundle } from "@/domain/content-types";
import { getContentStoreCapabilities, type ContentStoreCapabilities, loadContentDataset } from "@/lib/content-store";
import { getAllQuestionBundles } from "@/lib/sample-dataset";

export interface ReviewDashboardItem {
  bundle: QuestionBundle;
}

export interface ReviewDashboardViewModel {
  items: ReviewDashboardItem[];
  contentStore: ContentStoreCapabilities;
  summary: {
    unpublished: number;
    published: number;
  };
}

export async function getReviewDashboardViewModel(): Promise<ReviewDashboardViewModel> {
  const dataset = await loadContentDataset();
  const items = getAllQuestionBundles(dataset)
    .map((bundle) => ({ bundle }))
    .sort((left, right) => {
      const stageOrder =
        Number(left.bundle.question.status === "published") - Number(right.bundle.question.status === "published");
      if (stageOrder !== 0) {
        return stageOrder;
      }

      return right.bundle.question.updatedAt.localeCompare(left.bundle.question.updatedAt);
    });

  return {
    items,
    contentStore: getContentStoreCapabilities(),
    summary: {
      unpublished: items.filter((item) => item.bundle.question.status === "unpublished").length,
      published: items.filter((item) => item.bundle.question.status === "published").length
    }
  };
}
