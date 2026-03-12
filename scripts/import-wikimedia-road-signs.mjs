import fs from "node:fs/promises";
import path from "node:path";

const DATASET_PATH = path.resolve(process.cwd(), "data/samples/mvp-sample-question-set.json");
const OUTPUT_DIR = path.resolve(process.cwd(), "public/reference-signs/japan");
const COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php";
const WIKIPEDIA_PARSE_API_URL = "https://en.wikipedia.org/w/api.php";
const IMPORT_SOURCE_PREFIX = "src_gls_sign_";
const IMPORT_TERM_PREFIX = "gls_sign_";
const USER_AGENT = "PassDrive importer/1.0 (local development)";
const RELATED_CATEGORY_ID = "cat_road_signs";
const RETRY_DELAYS_MS = [2000, 5000, 10000, 20000];
const CURRENT_SECTION_LABELS = new Set([
  "Guide signs",
  "Warning signs",
  "Regulatory signs",
  "Instruction signs",
  "Supplemental signs",
  "Other signs"
]);

const SIGN_KIND_ORDER = {
  warning: 1,
  prohibitory: 2,
  mandatory: 3,
  priority: 4,
  supplemental: 5,
  expressway: 6,
  regulatory: 7,
  other: 8
};

const SIGN_KIND_LABEL = {
  warning: "Warning",
  prohibitory: "Prohibitory",
  mandatory: "Mandatory",
  priority: "Priority",
  supplemental: "Supplemental",
  expressway: "Expressway",
  regulatory: "Regulatory",
  other: "Guide or information"
};

function decodeHtml(value) {
  return value
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, digits) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
}

function stripTags(value) {
  return decodeHtml(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeFileTitle(value) {
  return decodeHtml(value).replace(/_/g, " ").trim();
}

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function wait(durationMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

async function fetchWithRetry(url) {
  let lastError;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT
      }
    });

    if (response.ok) {
      return response;
    }

    if (response.status !== 429 && response.status < 500) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    lastError = new Error(`Failed to fetch ${url}: ${response.status}`);
    const retryAfterHeader = response.headers.get("retry-after");
    const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : Number.NaN;
    const delayMs = Number.isFinite(retryAfterMs)
      ? retryAfterMs
      : RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];

    await wait(delayMs);
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

async function fetchJson(baseUrl, params) {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetchWithRetry(url.toString());
  return response.json();
}

function resolveThumbnailUrl(relativeUrl) {
  return relativeUrl.startsWith("//") ? `https:${relativeUrl}` : relativeUrl;
}

function deriveSignKind(sectionLabel) {
  const normalized = sectionLabel.toLowerCase();

  if (normalized.includes("warning")) {
    return "warning";
  }
  if (normalized.includes("prohibitory")) {
    return "prohibitory";
  }
  if (normalized.includes("mandatory")) {
    return "mandatory";
  }
  if (normalized.includes("priority")) {
    return "priority";
  }
  if (normalized.includes("supplemental") || normalized.includes("additional")) {
    return "supplemental";
  }
  if (normalized.includes("expressway")) {
    return "expressway";
  }
  if (normalized.includes("regulatory")) {
    return "regulatory";
  }

  return "other";
}

function buildShortDefinition(label, signKind) {
  if (signKind === "other") {
    return "Guide or information sign used in Japan.";
  }

  if (signKind === "expressway") {
    return "Expressway sign used in Japan.";
  }

  return `${SIGN_KIND_LABEL[signKind]} sign used in Japan.`;
}

function buildLongExplanation(label, sectionLabel) {
  return `${label} is listed in the Wikimedia Commons and Wikipedia reference gallery for road signs in Japan under ${sectionLabel}.`;
}

function buildAltText(label) {
  return `${label} road sign used in Japan.`;
}

async function fetchRoadSignsArticleHtml() {
  const json = await fetchJson(WIKIPEDIA_PARSE_API_URL, {
    action: "parse",
    page: "Road_signs_in_Japan",
    prop: "text",
    formatversion: "2",
    format: "json"
  });

  return json.parse?.text ?? "";
}

function extractGalleryItems(articleHtml) {
  const headingMatches = [...articleHtml.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)].map(
    (match) => ({
      index: match.index ?? 0,
      label: stripTags(match[2])
    })
  );

  const galleryRegex =
    /<li class="gallerybox"[\s\S]*?<a href="\/wiki\/File:([^"]+)" class="mw-file-description" title="([^"]*)"><img alt="([^"]*)" src="([^"]+)"[\s\S]*?<\/a><\/span><\/div>\s*<div class="gallerytext">([\s\S]*?)<\/div>\s*<\/li>/g;
  const galleryItems = [];

  for (const match of articleHtml.matchAll(galleryRegex)) {
    const index = match.index ?? 0;
    const currentHeading =
      [...headingMatches]
        .reverse()
        .find((heading) => heading.index <= index)?.label ?? "Road signs in Japan";

    const label = stripTags(match[5] || match[2] || match[3]);

    if (!CURRENT_SECTION_LABELS.has(currentHeading)) {
      continue;
    }

    galleryItems.push({
      fileTitle: normalizeFileTitle(match[1]),
      label,
      sectionLabel: currentHeading,
      thumbnailUrl: resolveThumbnailUrl(match[4])
    });
  }

  const uniqueByFileTitle = new Map();

  for (const item of galleryItems) {
    if (!uniqueByFileTitle.has(item.fileTitle)) {
      uniqueByFileTitle.set(item.fileTitle, item);
    }
  }

  return [...uniqueByFileTitle.values()];
}

async function fetchImageMetadata(fileTitles) {
  const metadataByTitle = new Map();

  for (const titleChunk of chunk(fileTitles.map((title) => `File:${title}`), 25)) {
    const json = await fetchJson(COMMONS_API_URL, {
      action: "query",
      prop: "imageinfo",
      titles: titleChunk.join("|"),
      iiprop: "url|extmetadata",
      format: "json"
    });

    for (const page of Object.values(json.query?.pages ?? {})) {
      const imageInfo = page.imageinfo?.[0];
      if (!imageInfo) {
        continue;
      }

      metadataByTitle.set(normalizeFileTitle(page.title.replace(/^File:/, "")), {
        descriptionUrl: imageInfo.descriptionurl,
        extmetadata: imageInfo.extmetadata ?? {}
      });
    }
  }

  return metadataByTitle;
}

function getMetadataValue(extmetadata, key) {
  const value = extmetadata?.[key]?.value;
  return typeof value === "string" ? stripTags(value) : "";
}

function hasApprovedLicense(extmetadata) {
  const licenseShortName = getMetadataValue(extmetadata, "LicenseShortName").toLowerCase();
  const usageTerms = getMetadataValue(extmetadata, "UsageTerms").toLowerCase();
  const categories = getMetadataValue(extmetadata, "Categories").toLowerCase();

  return (
    licenseShortName.includes("public domain") ||
    usageTerms.includes("public domain") ||
    categories.includes("pd-japan-exempt")
  );
}

async function downloadAsset(url, fileSlug) {
  const extension = path.extname(new URL(url).pathname) || ".png";
  const outputFileName = `${fileSlug}${extension.toLowerCase()}`;
  const outputFilePath = path.join(OUTPUT_DIR, outputFileName);
  const assetPath = `/reference-signs/japan/${outputFileName}`;

  try {
    const stat = await fs.stat(outputFilePath);
    if (stat.size > 0) {
      return assetPath;
    }
  } catch {}

  const response = await fetchWithRetry(url);
  const arrayBuffer = await response.arrayBuffer();

  await fs.writeFile(outputFilePath, Buffer.from(arrayBuffer));
  await wait(2000);

  return assetPath;
}

async function main() {
  const rawDataset = await fs.readFile(DATASET_PATH, "utf8");
  const dataset = JSON.parse(rawDataset);
  const articleHtml = await fetchRoadSignsArticleHtml();
  const galleryItems = extractGalleryItems(articleHtml);
  const metadataByTitle = await fetchImageMetadata(galleryItems.map((item) => item.fileTitle));
  const now = new Date().toISOString();

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const importedSigns = [];

  for (const [index, item] of galleryItems.entries()) {
    const metadata = metadataByTitle.get(item.fileTitle);

    if (!metadata || !hasApprovedLicense(metadata.extmetadata)) {
      continue;
    }

    const fileSlug = slugify(item.fileTitle);
    const signKind = deriveSignKind(item.sectionLabel);
    const imageAssetPath = await downloadAsset(item.thumbnailUrl, fileSlug);
    const sourceReferenceId = `${IMPORT_SOURCE_PREFIX}${fileSlug}`;
    const licenseShortName = getMetadataValue(metadata.extmetadata, "LicenseShortName") || "Public domain";
    const credit = getMetadataValue(metadata.extmetadata, "Credit");

    importedSigns.push({
      sourceReference: {
        id: sourceReferenceId,
        sourceName: `Wikimedia Commons: ${item.label}`,
        sourceType: "other",
        sourceUrl: metadata.descriptionUrl,
        publisher: "Wikimedia Commons",
        regionScope: "national",
        originalLanguage: "en",
        fetchedAt: now,
        rightsStatus: "approved",
        rightsNotes: `${licenseShortName}. Downloaded from the Wikimedia Commons road sign gallery for Japan.${credit ? ` Credit: ${credit}.` : ""}`,
        lastVerifiedAt: now,
        createdAt: now,
        updatedAt: now
      },
      glossaryTerm: {
        id: `${IMPORT_TERM_PREFIX}${fileSlug}`,
        termEn: item.label,
        shortDefinitionEn: buildShortDefinition(item.label, signKind),
        longExplanationEn: buildLongExplanation(item.label, item.sectionLabel),
        relatedCategoryId: RELATED_CATEGORY_ID,
        sourceReferenceId,
        imageAssetPath,
        imageAltTextEn: buildAltText(item.label),
        isTrafficSign: true,
        trafficSignKind: signKind
      }
    });

    if ((index + 1) % 25 === 0) {
      console.log(`Imported ${index + 1}/${galleryItems.length} road signs...`);
    }
  }

  importedSigns.sort((left, right) => {
    const kindDelta =
      (SIGN_KIND_ORDER[left.glossaryTerm.trafficSignKind] ?? SIGN_KIND_ORDER.other) -
      (SIGN_KIND_ORDER[right.glossaryTerm.trafficSignKind] ?? SIGN_KIND_ORDER.other);

    if (kindDelta !== 0) {
      return kindDelta;
    }

    return left.glossaryTerm.termEn.localeCompare(right.glossaryTerm.termEn, "en");
  });

  const nonTrafficTerms = dataset.glossaryTerms
    .filter((term) => !term.id.startsWith(IMPORT_TERM_PREFIX))
    .filter((term) => !term.isTrafficSign)
    .sort((left, right) => left.displayOrder - right.displayOrder);

  dataset.sourceReferences = [
    ...dataset.sourceReferences.filter((sourceReference) => !sourceReference.id.startsWith(IMPORT_SOURCE_PREFIX)),
    ...importedSigns.map((item) => item.sourceReference)
  ];

  dataset.glossaryTerms = [
    ...importedSigns.map((item, index) => ({
      ...item.glossaryTerm,
      displayOrder: index + 1
    })),
    ...nonTrafficTerms.map((term, index) => ({
      ...term,
      displayOrder: importedSigns.length + index + 1
    }))
  ];

  dataset.meta.generatedAt = now;
  if (!dataset.meta.notes.includes("Wikimedia Commons road sign gallery")) {
    dataset.meta.notes = `${dataset.meta.notes} Includes Wikimedia Commons road sign gallery imports for Signs & Terms.`;
  }

  await fs.writeFile(DATASET_PATH, `${JSON.stringify(dataset, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        importedSigns: importedSigns.length,
        glossaryTerms: dataset.glossaryTerms.length,
        sourceReferences: dataset.sourceReferences.length
      },
      null,
      2
    )
  );
}

await main();
