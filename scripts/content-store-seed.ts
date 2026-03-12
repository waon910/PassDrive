import { closeConfiguredContentStore, seedConfiguredContentStoreFromSampleDataset } from "../src/lib/content-store";

async function main() {
  await seedConfiguredContentStoreFromSampleDataset();
  console.log("Seeded the configured content store from data/samples/mvp-sample-question-set.json");
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeConfiguredContentStore();
  });
