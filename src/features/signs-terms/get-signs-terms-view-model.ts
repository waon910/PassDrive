import { loadContentDataset } from "@/lib/content-store";
import { getGlossaryTermDetails } from "@/lib/sample-dataset";

export async function getSignsTermsViewModel() {
  const dataset = await loadContentDataset();
  const glossaryDetails = getGlossaryTermDetails(dataset);
  const trafficSignCount = glossaryDetails.filter((item) => item.term.isTrafficSign).length;
  const termCount = glossaryDetails.length - trafficSignCount;

  return {
    glossaryDetails,
    trafficSignCount,
    termCount
  };
}
