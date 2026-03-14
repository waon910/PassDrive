import fs from "node:fs/promises";
import path from "node:path";

const DATASET_PATH = path.resolve(process.cwd(), "data/samples/mvp-sample-question-set.json");
const PUBLIC_IMAGE_DIR = path.resolve(process.cwd(), "public/question-images/takaragaike-honmen");
const SOURCE_BASE_URL = "https://www.takaragaike.co.jp/se_q/";
const SOURCE_SELECTION_URL = new URL("seqsen.html", SOURCE_BASE_URL).toString();
const SOURCE_REFERENCE_ID = "src_takaragaike_honmen";
const TRANSLATION_SEPARATOR = "\n[[[PASSDRIVE_SPLIT]]]\n";
const MAX_TRANSLATION_QUERY_LENGTH = 3200;

const SET_NUMBERS = [1, 2, 3, 4];

const CATEGORY_KEYWORDS = [
  ["cat_railroad_crossings", ["踏切"]],
  ["cat_parking_stopping", ["駐車", "停車", "駐停車", "客待ち", "荷待ち", "パーキングメーター"]],
  ["cat_road_signs", ["標識", "標示", "信号", "灯火", "警察官", "横断歩道", "自転車横断帯"]],
  ["cat_pedestrians_bicycles", ["歩行者", "自転車", "横断歩道", "幼児", "児童", "高齢者", "二輪車", "通学", "通園"]],
  ["cat_safety_checks", ["点検", "整備", "故障", "タイヤ", "ライト", "ブレーキ", "冷却水", "オーバーヒート", "チャイルドシート"]],
  ["cat_lane_rules", ["車線", "通行帯", "追い越し", "追越し", "進路変更", "合流", "右折", "左折", "転回", "一方通行", "路側帯"]],
  ["cat_right_of_way", ["交差点", "優先", "緊急自動車", "警察官", "一時停止", "徐行", "横断歩道"]],
  ["cat_speed_stopping", ["速度", "停止距離", "停止位置", "最高速度", "高速道路", "高速自動車国道", "停止", "信号"]]
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

function buildAbsoluteUrl(relativeOrAbsoluteUrl) {
  return new URL(relativeOrAbsoluteUrl, SOURCE_BASE_URL).toString();
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
  if (/(高速道路|高速自動車国道|けん引|オーバーヒート|パワーステアリング|停止距離|二段階右折)/.test(stem)) {
    return "medium";
  }

  if (/(交差点|横断歩道|優先|追い越し|進路変更|右折|左折)/.test(stem)) {
    return "medium";
  }

  return "easy";
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

async function fetchShiftJisHtml(relativePath) {
  const buffer = await fetchBuffer(buildAbsoluteUrl(relativePath));
  return new TextDecoder("shift_jis").decode(buffer);
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

function parseQuestionPage(html, setNumber) {
  const questionRegex = /<li(?:\s+value=\d+)?><!([0-9０-９]+)>([\s\S]*?)<font color=#0000ff>/g;
  const questions = [];

  for (const match of html.matchAll(questionRegex)) {
    const questionNumber = Number(match[1].replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 65248)));
    const bodyHtml = match[2];
    const imageMatch = bodyHtml.match(/<img src="([^"]+)"/i);

    questions.push({
      ref: `honte-${String(setNumber).padStart(2, "0")}-${String(questionNumber).padStart(2, "0")}`,
      questionNumber,
      stemJa: stripTags(bodyHtml),
      imageUrl: imageMatch ? buildAbsoluteUrl(imageMatch[1]) : null
    });
  }

  if (questions.length !== 50) {
    throw new Error(`Expected 50 questions in set ${setNumber}, received ${questions.length}.`);
  }

  return questions;
}

function parseAnswerPage(html) {
  const answers = new Map();

  for (const match of html.matchAll(/(\d+)\s*[−－-]\s*([○×])/g)) {
    answers.set(Number(match[1]), match[2] === "○" ? "T" : "F");
  }

  return answers;
}

function parseExplanationPage(html) {
  const explanations = new Map();
  const explanationRegex = /<li(?:\s+value=)?(\d+)>\s*([\s\S]*?)(?=<li(?:\s+value=)?\d+>|<\/font>)/g;

  for (const match of html.matchAll(explanationRegex)) {
    explanations.set(Number(match[1]), stripTags(match[2]));
  }

  return explanations;
}

async function ensureImageDownloaded(url) {
  if (!url) {
    return null;
  }

  await fs.mkdir(PUBLIC_IMAGE_DIR, { recursive: true });
  const sourceUrl = new URL(url);
  const fileName = path.basename(sourceUrl.pathname).replace(/[^a-zA-Z0-9._-]/g, "-");
  const outputPath = path.join(PUBLIC_IMAGE_DIR, fileName);

  try {
    await fs.access(outputPath);
  } catch {
    const buffer = await fetchBuffer(sourceUrl.toString());
    await fs.writeFile(outputPath, buffer);
  }

  return `/question-images/takaragaike-honmen/${fileName}`;
}

function buildFallbackExplanation(correctChoiceKey) {
  return correctChoiceKey === "T"
    ? "The source answer key marks this statement as true. The linked source page does not provide a detailed note for this item, so review the rule described in the question."
    : "The source answer key marks this statement as false. The linked source page does not provide a detailed note for this item, so review which part of the rule makes the statement incorrect.";
}

function buildChoices(questionId) {
  return [
    {
      id: `ch_${questionId}_f`,
      questionId,
      choiceKey: "F",
      displayOrder: 1,
      englishText: "False",
      isCorrect: false
    },
    {
      id: `ch_${questionId}_t`,
      questionId,
      choiceKey: "T",
      displayOrder: 2,
      englishText: "True",
      isCorrect: false
    }
  ];
}

async function main() {
  const raw = await fs.readFile(DATASET_PATH, "utf8");
  const dataset = JSON.parse(raw);
  const now = new Date().toISOString();
  const activeContentVersionId = dataset.contentVersions.find((version) => version.status === "active")?.id;

  if (!activeContentVersionId) {
    throw new Error("Could not find an active content version.");
  }

  const allQuestions = [];

  for (const setNumber of SET_NUMBERS) {
    const [questionHtml, answerHtml, explanationHtml] = await Promise.all([
      fetchShiftJisHtml(`honte_q${String(setNumber).padStart(2, "0")}t.html`),
      fetchShiftJisHtml(`honte_a${String(setNumber).padStart(2, "0")}.html`),
      fetchShiftJisHtml(`honte_k${String(setNumber).padStart(2, "0")}.html`)
    ]);

    const parsedQuestions = parseQuestionPage(questionHtml, setNumber);
    const answers = parseAnswerPage(answerHtml);
    const explanations = parseExplanationPage(explanationHtml);

    for (const question of parsedQuestions) {
      const correctChoiceKey = answers.get(question.questionNumber);

      if (!correctChoiceKey) {
        throw new Error(`Missing answer for set ${setNumber} question ${question.questionNumber}.`);
      }

      allQuestions.push({
        ...question,
        setNumber,
        correctChoiceKey,
        explanationJa: explanations.get(question.questionNumber) ?? null
      });
    }
  }

  const translationMap = await translateTexts(
    allQuestions.flatMap((question) => [question.stemJa, question.explanationJa].filter(Boolean))
  );

  dataset.questions = dataset.questions.filter((question) => !String(question.id).startsWith("q_takaragaike_honmen_"));
  dataset.choices = dataset.choices.filter((choice) => !String(choice.questionId).startsWith("q_takaragaike_honmen_"));
  dataset.explanations = dataset.explanations.filter(
    (explanation) => !String(explanation.questionId).startsWith("q_takaragaike_honmen_")
  );
  dataset.questionTags = dataset.questionTags.filter((mapping) => !String(mapping.questionId).startsWith("q_takaragaike_honmen_"));

  const existingSource = dataset.sourceReferences.find((sourceReference) => sourceReference.id === SOURCE_REFERENCE_ID);
  const rightsNotes =
    'The source page states "anyone may use these practice questions freely," but separate redistribution rights were not independently verified.';

  if (existingSource) {
    existingSource.sourceName = "Takaragaike Driving School Honmen Practice";
    existingSource.sourceType = "other";
    existingSource.sourceUrl = SOURCE_SELECTION_URL;
    existingSource.publisher = "Kyoto Takaragaike Driving School";
    existingSource.regionScope = "national";
    existingSource.originalLanguage = "ja";
    existingSource.fetchedAt = now;
    existingSource.snapshotPath = "snapshots/takaragaike-honmen-practice.html";
    existingSource.rightsNotes = rightsNotes;
    existingSource.updatedAt = now;
  } else {
    dataset.sourceReferences.push({
      id: SOURCE_REFERENCE_ID,
      sourceName: "Takaragaike Driving School Honmen Practice",
      sourceType: "other",
      sourceUrl: SOURCE_SELECTION_URL,
      publisher: "Kyoto Takaragaike Driving School",
      regionScope: "national",
      originalLanguage: "ja",
      fetchedAt: now,
      snapshotPath: "snapshots/takaragaike-honmen-practice.html",
      rightsNotes,
      createdAt: now,
      updatedAt: now
    });
  }

  for (const [index, item] of allQuestions.entries()) {
    const questionId = `q_takaragaike_honmen_${String(index + 1).padStart(4, "0")}`;
    const explanationId = `exp_takaragaike_honmen_${String(index + 1).padStart(4, "0")}_v1`;
    const imageAssetPath = await ensureImageDownloaded(item.imageUrl);
    const englishStem = translationMap.get(item.stemJa) ?? item.stemJa;
    const translatedExplanation = item.explanationJa ? translationMap.get(item.explanationJa) : null;
    const choices = buildChoices(questionId).map((choice) => ({
      ...choice,
      isCorrect: choice.choiceKey === item.correctChoiceKey
    }));

    dataset.questions.push({
      id: questionId,
      sourceReferenceId: SOURCE_REFERENCE_ID,
      contentVersionId: activeContentVersionId,
      sourceQuestionRef: item.ref,
      questionType: "true_false",
      mainCategoryId: pickCategoryId(item.stemJa),
      difficulty: pickDifficulty(item.stemJa),
      status: "published",
      originalStem: item.stemJa,
      originalLanguage: "ja",
      englishStem,
      correctChoiceKey: item.correctChoiceKey,
      hasImage: Boolean(imageAssetPath),
      imageAssetPath: imageAssetPath ?? undefined,
      imageAltTextEn: imageAssetPath ? `Illustration for ${item.ref}.` : undefined,
      explanationOrigin: translatedExplanation ? "source" : "manual",
      activeExplanationId: explanationId,
      isExamEligible: true,
      publishedAt: now,
      createdAt: now,
      updatedAt: now
    });

    dataset.choices.push(...choices);
    dataset.explanations.push({
      id: explanationId,
      questionId,
      origin: translatedExplanation ? "source" : "manual",
      bodyEn: translatedExplanation ?? buildFallbackExplanation(item.correctChoiceKey),
      sourceDerived: Boolean(translatedExplanation),
      createdBy: "import-takaragaike-honmen-questions",
      createdAt: now,
      updatedAt: now
    });
  }

  dataset.meta.generatedAt = now;
  if (typeof dataset.meta.notes === "string" && !dataset.meta.notes.includes("Takaragaike honmen")) {
    dataset.meta.notes = `${dataset.meta.notes} Added Takaragaike honmen practice items.`;
  }

  await fs.writeFile(DATASET_PATH, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
