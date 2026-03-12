import { getGlossaryTermDetails, loadSampleDataset } from "@/lib/sample-dataset";

export async function getSignsTermsViewModel() {
  const dataset = await loadSampleDataset();
  const glossaryDetails = getGlossaryTermDetails(dataset);

  return {
    glossaryDetails
  };
}
