import { loadContentDataset } from "@/lib/content-store";
import { getGlossaryTermDetails } from "@/lib/sample-dataset";

export async function getSignsTermsViewModel() {
  const dataset = await loadContentDataset();
  const glossaryDetails = getGlossaryTermDetails(dataset);

  return {
    glossaryDetails
  };
}
