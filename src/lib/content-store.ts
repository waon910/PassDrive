import type { SampleQuestionDataset } from "@/domain/content-types";
import {
  destroyContentDatabase,
  ensureContentDatabaseReady,
  loadContentDatasetFromDatabase,
  replaceContentDatasetInDatabase,
  seedContentDatabaseFromSampleDataset
} from "@/lib/content-database";
import { getContentStoreMode, isRelationalContentStoreMode, type ContentStoreMode } from "@/lib/content-store-config";
import { mutateSampleDataset } from "@/lib/sample-dataset-admin";
import { loadSampleDataset } from "@/lib/sample-dataset";

export type { ContentStoreMode } from "@/lib/content-store-config";

export interface ContentStoreCapabilities {
  mode: ContentStoreMode;
  runtimeWritable: boolean;
}

export function getContentStoreCapabilities(): ContentStoreCapabilities {
  const mode = getContentStoreMode();

  if (mode === "file") {
    return {
      mode,
      runtimeWritable: !Boolean(process.env.VERCEL)
    };
  }

  return {
    mode,
    runtimeWritable: true
  };
}

export async function loadContentDataset(): Promise<SampleQuestionDataset> {
  const mode = getContentStoreMode();

  if (!isRelationalContentStoreMode(mode)) {
    return loadSampleDataset();
  }

  await ensureContentDatabaseReady(mode);
  return loadContentDatasetFromDatabase(mode);
}

export async function mutateContentDataset(mutation: (dataset: SampleQuestionDataset) => void) {
  const mode = getContentStoreMode();
  const capabilities = getContentStoreCapabilities();

  if (!capabilities.runtimeWritable) {
    throw new Error(
      "File-backed content storage is read-only on Vercel. Configure a database-backed content store before using review actions in deployment."
    );
  }

  if (!isRelationalContentStoreMode(mode)) {
    return mutateSampleDataset(mutation);
  }

  const dataset = await loadContentDatasetFromDatabase(mode);
  mutation(dataset);
  await replaceContentDatasetInDatabase(mode, dataset);
}

export async function seedConfiguredContentStoreFromSampleDataset() {
  const mode = getContentStoreMode();

  if (!isRelationalContentStoreMode(mode)) {
    throw new Error("CONTENT_STORE_MODE must be sqlite or postgres to seed a database-backed content store.");
  }

  await seedContentDatabaseFromSampleDataset(mode);
}

export async function closeConfiguredContentStore() {
  const mode = getContentStoreMode();

  if (!isRelationalContentStoreMode(mode)) {
    return;
  }

  await destroyContentDatabase();
}
