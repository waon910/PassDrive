import fs from "node:fs/promises";
import path from "node:path";

const DATASET_PATH = path.resolve(process.cwd(), "data/samples/mvp-sample-question-set.json");
const PUBLIC_IMAGE_DIR = path.resolve(process.cwd(), "public/question-images/car-license");
const SOURCE_BASE_URL = "https://www.car-license.co.jp";
const SOURCE_INDEX_URL = `${SOURCE_BASE_URL}/feature/question/`;
const SOURCE_REFERENCE_ID = "src_011";
const CONTENT_VERSION_ID = "cv_2026_03_11";
const TRANSLATION_SEPARATOR = "\n[[[PASSDRIVE_SPLIT]]]\n";
const MAX_TRANSLATION_QUERY_LENGTH = 3200;

const CATEGORY_KEYWORDS = [
  ["cat_railroad_crossings", ["踏切"]],
  ["cat_parking_stopping", ["駐車", "停車", "駐停車", "客待ち", "荷待ち"]],
  ["cat_road_signs", ["標識", "信号機", "信号", "警戒標識", "規制標識", "指示標識"]],
  ["cat_pedestrians_bicycles", ["歩行者", "自転車", "横断歩道", "横断中", "幼児", "児童", "高齢者"]],
  ["cat_safety_checks", ["点検", "整備", "シートベルト", "座席ベルト", "故障", "タイヤ", "ライト", "ブレーキ", "疲労", "眠気", "酒", "飲酒", "乗客", "非常信号", "合図不履行", "健康"]],
  ["cat_lane_rules", ["車線", "通行帯", "追い越し", "追越し", "進路変更", "合流", "登坂車線", "路側帯", "路肩", "中央線", "高速自動車国道", "本線車道", "追越車線", "右折方法", "左折方法", "転回"]],
  ["cat_right_of_way", ["交差点", "優先", "直進", "右折", "左折", "右方", "左方", "徐行すべき場所"]],
  ["cat_speed_stopping", ["速度", "徐行", "停止", "一時停止", "警音器", "徐行場所", "制限速度", "最高速度"]]
];

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

function normalizeText(value) {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildAbsoluteUrl(relativeOrAbsoluteUrl) {
  return new URL(relativeOrAbsoluteUrl, SOURCE_BASE_URL).toString();
}

function nextEntityId(prefix, records) {
  let max = 0;

  for (const record of records) {
    const match = typeof record.id === "string" ? record.id.match(new RegExp(`^${prefix}_(\\d+)`)) : null;
    if (!match) {
      continue;
    }
    max = Math.max(max, Number(match[1]));
  }

  return `${prefix}_${String(max + 1).padStart(4, "0")}`;
}

function pickCategoryId(stem) {
  for (const [categoryId, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => stem.includes(keyword))) {
      return categoryId;
    }
  }

  return "cat_speed_stopping";
}

function pickDifficulty(stem) {
  if (/[0-9０-９]+メートル|高速自動車国道|本線車道|転回|交差点|優先/.test(stem)) {
    return "medium";
  }
  if (/(故障|酒|飲酒|疲労|眠気|乗客|追い越し|追越し|進路変更|合流|踏切)/.test(stem)) {
    return "medium";
  }
  return "easy";
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "PassDrive importer/1.0"
    },
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "PassDrive importer/1.0"
    },
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function sortChallengeLinks(links) {
  return [...links].sort((left, right) => {
    const leftMatch = left.match(/challenge(\d+)-(\d+)\.html/);
    const rightMatch = right.match(/challenge(\d+)-(\d+)\.html/);
    if (!leftMatch || !rightMatch) {
      return left.localeCompare(right);
    }

    const leftChallenge = Number(leftMatch[1]);
    const rightChallenge = Number(rightMatch[1]);
    const leftPage = Number(leftMatch[2]);
    const rightPage = Number(rightMatch[2]);

    return leftChallenge - rightChallenge || leftPage - rightPage;
  });
}

function parseChallengeLinks(indexHtml) {
  const challengeStarts = new Set(
    [...indexHtml.matchAll(/\/feature\/question\/challenge(\d+)-1\.html/g)].map((match) => Number(match[1]))
  );

  return sortChallengeLinks(
    [...challengeStarts].flatMap((challengeNumber) =>
      Array.from({ length: 9 }, (_, pageIndex) => `challenge${challengeNumber}-${pageIndex + 1}.html`)
    )
  );
}

function parseQuestionPage(html, pageSlug) {
  const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, "");
  const wrappers = [
    ...cleanHtml.matchAll(
      /<div class="question-wrapper">([\s\S]*?)<\/div>\s*(?=<div class="question-wrapper">|<div class="pagination"|<\/section>)/g
    )
  ];
  const questions = [];

  for (const wrapperMatch of wrappers) {
    const wrapper = wrapperMatch[1];
    const questionNumberMatch = wrapper.match(/<dt>Q(\d+)<\/dt>/);
    const stemMatch = wrapper.match(/<dd>\s*([\s\S]*?)<\/dd>\s*<\/dl>\s*<div class="answer-btn">/);
    const answerMatch = wrapper.match(/<dl class="answer-box">\s*<dt>([○×])<\/dt>\s*<dd>\s*([\s\S]*?)<\/dd>/);

    if (!questionNumberMatch) {
      continue;
    }

    if (!stemMatch || !answerMatch) {
      if (wrapper.includes("現在準備中")) {
        continue;
      }
      throw new Error(`Failed to parse question block from ${pageSlug}`);
    }

    const questionNumber = Number(questionNumberMatch[1]);
    const stemHtml = stemMatch[1];
    const imageMatch = stemHtml.match(/<img src="([^"]+)"/);
    const paragraphs = [...stemHtml.matchAll(/<p>([\s\S]*?)<\/p>/g)];
    const stemText = stripTags(paragraphs.map((paragraphMatch) => paragraphMatch[1]).join(" "));
    const explanationText = stripTags(answerMatch[2]);
    const correctChoiceKey = answerMatch[1] === "○" ? "T" : "F";

    questions.push({
      ref: `${pageSlug.replace(".html", "")}-q${questionNumber}`,
      sourcePagePath: `/feature/question/${pageSlug}`,
      questionNumber,
      originalStem: stemText,
      explanationJa: explanationText,
      correctChoiceKey,
      imageUrl: imageMatch ? buildAbsoluteUrl(imageMatch[1]) : null
    });
  }

  return questions;
}

function buildTranslationBatches(texts) {
  const batches = [];
  let currentBatch = [];
  let currentLength = 0;

  for (const text of texts) {
    const contribution = encodeURIComponent(text).length + encodeURIComponent(TRANSLATION_SEPARATOR).length;

    if (currentBatch.length > 0 && currentLength + contribution > MAX_TRANSLATION_QUERY_LENGTH) {
      batches.push(currentBatch);
      currentBatch = [];
      currentLength = 0;
    }

    currentBatch.push(text);
    currentLength += contribution;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

async function translateBatch(texts, attempt = 1) {
  const joined = texts.join(TRANSLATION_SEPARATOR);
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=" +
    encodeURIComponent(joined);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "PassDrive importer/1.0"
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`translate status ${response.status}`);
    }

    const payload = await response.json();
    const translatedText = payload[0].map((part) => part[0]).join("");
    const pieces = translatedText.split(TRANSLATION_SEPARATOR).map((piece) => piece.trim());

    if (pieces.length !== texts.length) {
      throw new Error(`translate split mismatch ${pieces.length} !== ${texts.length}`);
    }

    return pieces;
  } catch (error) {
    if (attempt >= 4) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    return translateBatch(texts, attempt + 1);
  }
}

async function translateTexts(texts) {
  const uniqueTexts = [...new Set(texts.filter(Boolean))];
  const translationMap = new Map();
  const batches = buildTranslationBatches(uniqueTexts);

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`Translating batch ${index + 1}/${batches.length} (${batch.length} strings)`);
    const translatedBatch = await translateBatch(batch);

    batch.forEach((sourceText, sourceIndex) => {
      translationMap.set(sourceText, translatedBatch[sourceIndex]);
    });

    if (index < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  return translationMap;
}

async function downloadImage(url) {
  if (!url) {
    return null;
  }

  await fs.mkdir(PUBLIC_IMAGE_DIR, { recursive: true });
  const urlObject = new URL(url);
  const originalName = path.basename(urlObject.pathname);
  const fileName = originalName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const relativeAssetPath = `/question-images/car-license/${fileName}`;
  const filePath = path.join(PUBLIC_IMAGE_DIR, fileName);

  try {
    await fs.access(filePath);
    return relativeAssetPath;
  } catch {
    // Continue and download when missing.
  }

  const buffer = await fetchBuffer(url);
  await fs.writeFile(filePath, buffer);

  return relativeAssetPath;
}

function ensureSourceReference(dataset, now) {
  const rightsNotes =
    "Imported from Car License Navi Japanese question pages with machine-translated English drafts and locally downloaded figure assets. Rights review and language review are required before publication.";
  const existing = dataset.sourceReferences.find((sourceReference) => sourceReference.id === SOURCE_REFERENCE_ID);

  if (existing) {
    existing.sourceName = "Car License Navi Honmen Questions";
    existing.sourceType = "other";
    existing.sourceUrl = SOURCE_INDEX_URL;
    existing.publisher = "合宿免許ナビ";
    existing.regionScope = "national";
    existing.originalLanguage = "ja";
    existing.rightsStatus = "review_required";
    existing.rightsNotes = rightsNotes;
    existing.lastVerifiedAt = now;
    existing.updatedAt = now;
    if (!existing.fetchedAt) {
      existing.fetchedAt = now;
    }
    return;
  }

  dataset.sourceReferences.push({
    id: SOURCE_REFERENCE_ID,
    sourceName: "Car License Navi Honmen Questions",
    sourceType: "other",
    sourceUrl: SOURCE_INDEX_URL,
    publisher: "合宿免許ナビ",
    regionScope: "national",
    originalLanguage: "ja",
    fetchedAt: now,
    rightsStatus: "review_required",
    rightsNotes,
    lastVerifiedAt: now,
    createdAt: now,
    updatedAt: now
  });
}

async function main() {
  const raw = await fs.readFile(DATASET_PATH, "utf8");
  const dataset = JSON.parse(raw);
  const now = new Date().toISOString();

  ensureSourceReference(dataset, now);

  const existingQuestionsByRef = new Map(
    dataset.questions
      .filter((question) => typeof question.sourceQuestionRef === "string" && question.sourceQuestionRef.length > 0)
      .map((question) => [question.sourceQuestionRef, question])
  );
  const existingQuestionsByOriginalStem = new Map(
    dataset.questions
      .filter((question) => typeof question.originalStem === "string" && question.originalStem.length > 0)
      .map((question) => [normalizeText(question.originalStem), question])
  );

  const indexHtml = await fetchText(SOURCE_INDEX_URL);
  const challengeLinks = parseChallengeLinks(indexHtml);
  const questionRecords = [];

  for (const challengeLink of challengeLinks) {
    const pageHtml = await fetchText(buildAbsoluteUrl(`/feature/question/${challengeLink}`));
    questionRecords.push(...parseQuestionPage(pageHtml, challengeLink));
  }

  console.log(`Fetched ${challengeLinks.length} pages and parsed ${questionRecords.length} question records`);

  const translationMap = await translateTexts(
    questionRecords.flatMap((record) => [record.originalStem, record.explanationJa])
  );

  console.log(`Completed translation for ${translationMap.size} unique strings`);

  let addedQuestions = 0;
  let skippedDuplicates = 0;
  let backfilledImages = 0;

  for (const record of questionRecords) {
    const existingQuestion =
      existingQuestionsByRef.get(record.ref) ?? existingQuestionsByOriginalStem.get(normalizeText(record.originalStem));
    const imageAssetPath = await downloadImage(record.imageUrl);

    if (existingQuestion) {
      if (!existingQuestion.hasImage && imageAssetPath) {
        existingQuestion.hasImage = true;
        existingQuestion.imageAssetPath = imageAssetPath;
        existingQuestion.imageAltTextEn = "Image attached to the source question.";
        existingQuestion.imageCaptionEn = "Use the figure attached to the source question.";
        existingQuestion.updatedAt = now;
        backfilledImages += 1;
      }

      skippedDuplicates += 1;
      continue;
    }

    const questionId = nextEntityId("q", dataset.questions);
    const questionNumber = questionId.slice(2);
    const explanationId = `exp_${questionNumber}_v1`;
    const translationReviewId = `tr_${questionNumber}_v1`;
    const explanationReviewId = `er_${questionNumber}_v1`;
    const englishStem = translationMap.get(record.originalStem) ?? record.originalStem;
    const explanationEn = translationMap.get(record.explanationJa) ?? record.explanationJa;

    dataset.questions.push({
      id: questionId,
      sourceReferenceId: SOURCE_REFERENCE_ID,
      contentVersionId: CONTENT_VERSION_ID,
      sourceQuestionRef: record.ref,
      questionType: "true_false",
      mainCategoryId: pickCategoryId(record.originalStem),
      difficulty: pickDifficulty(record.originalStem),
      status: "translation_review",
      originalStem: record.originalStem,
      originalLanguage: "ja",
      englishStem,
      correctChoiceKey: record.correctChoiceKey,
      hasImage: Boolean(imageAssetPath),
      imageAssetPath: imageAssetPath ?? undefined,
      imageAltTextEn: imageAssetPath ? "Image attached to the source question." : undefined,
      imageCaptionEn: imageAssetPath ? "Use the figure attached to the source question." : undefined,
      explanationOrigin: "source",
      activeExplanationId: explanationId,
      translationReviewStatus: "pending",
      explanationReviewStatus: "pending",
      isExamEligible: true,
      createdAt: now,
      updatedAt: now
    });

    dataset.choices.push(
      {
        id: `ch_${questionNumber}_t`,
        questionId,
        choiceKey: "T",
        displayOrder: 1,
        originalText: "○",
        englishText: "True",
        isCorrect: record.correctChoiceKey === "T"
      },
      {
        id: `ch_${questionNumber}_f`,
        questionId,
        choiceKey: "F",
        displayOrder: 2,
        originalText: "×",
        englishText: "False",
        isCorrect: record.correctChoiceKey === "F"
      }
    );

    dataset.explanations.push({
      id: explanationId,
      questionId,
      origin: "source",
      bodyEn: explanationEn,
      sourceDerived: true,
      createdBy: "import-car-license-questions-script",
      createdAt: now,
      updatedAt: now
    });

    dataset.translationReviews.push({
      id: translationReviewId,
      questionId,
      reviewer: "pending-car-license-review",
      status: "pending",
      accuracyCheck: false,
      naturalnessCheck: false
    });

    dataset.explanationReviews.push({
      id: explanationReviewId,
      explanationId,
      reviewer: "pending-car-license-review",
      status: "pending",
      accuracyCheck: false,
      clarityCheck: false
    });

    existingQuestionsByRef.set(record.ref, dataset.questions[dataset.questions.length - 1]);
    existingQuestionsByOriginalStem.set(normalizeText(record.originalStem), dataset.questions[dataset.questions.length - 1]);
    addedQuestions += 1;

    if (addedQuestions % 100 === 0) {
      console.log(`Added ${addedQuestions} questions so far`);
    }
  }

  dataset.meta.generatedAt = now;
  dataset.meta.notes =
    "Sample fixture with synthetic MVP seed questions, the full JAF traffic quiz set, and Car License Navi Japanese honmen question imports translated into English drafts. All externally sourced items remain blocked behind manual rights and review checks.";

  dataset.sourceReferences.sort((left, right) => left.id.localeCompare(right.id));
  dataset.questions.sort((left, right) => left.id.localeCompare(right.id));
  dataset.choices.sort((left, right) => left.id.localeCompare(right.id));
  dataset.explanations.sort((left, right) => left.id.localeCompare(right.id));
  dataset.translationReviews.sort((left, right) => left.id.localeCompare(right.id));
  dataset.explanationReviews.sort((left, right) => left.id.localeCompare(right.id));

  await fs.writeFile(DATASET_PATH, `${JSON.stringify(dataset, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        fetchedPages: challengeLinks.length,
        parsedQuestions: questionRecords.length,
        addedQuestions,
        skippedDuplicates,
        backfilledImages,
        totalQuestions: dataset.questions.length
      },
      null,
      2
    )
  );
}

await main();
