import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { SampleQuestionDataset } from "@/domain/content-types";

const SAMPLE_DATASET_PATH = path.join(process.cwd(), "data", "samples", "mvp-sample-question-set.json");

type DatasetMutation = (dataset: SampleQuestionDataset) => void;

export async function mutateSampleDataset(mutation: DatasetMutation) {
  const raw = await readFile(SAMPLE_DATASET_PATH, "utf8");
  const dataset = JSON.parse(raw) as SampleQuestionDataset;

  mutation(dataset);

  await writeFile(SAMPLE_DATASET_PATH, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
}

export function getNowTimestamp() {
  return new Date().toISOString();
}
