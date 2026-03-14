import fs from "node:fs/promises";
import path from "node:path";

const DATASET_PATH = path.resolve(process.cwd(), "data/samples/mvp-sample-question-set.json");
const PUBLIC_IMAGE_DIR = path.resolve(process.cwd(), "public/question-images/kamiike-blog");
const SOURCE_REFERENCE_ID = "src_012";
const CONTENT_VERSION_ID = "cv_2026_03_11";
const SOURCE_URL = "https://www.kamiike.co.jp/blog/2024/01/31/4354/";

const QUESTIONS = [
  {
    ref: "kamiike-4354-q1",
    originalStem: "車を運転する時は、どんな時でも必ずシートベルトを着用しなければならない。",
    englishStem: "When driving a car, you must always wear a seat belt in every situation.",
    mainCategoryId: "cat_safety_checks",
    difficulty: "easy",
    correctChoiceKey: "F",
    explanationEn:
      "Seat belts are required in normal driving, but there are limited exceptions. The article notes exemptions when wearing a belt is difficult because of injury, disability, or pregnancy, when reversing, and during certain stop-and-go work such as mail delivery or garbage collection.",
    tagIds: ["tag_seatbelt", "tag_safety_check"]
  },
  {
    ref: "kamiike-4354-q2",
    originalStem: "正面の信号が黄色の点滅をしているときは、車は徐行して進まなければならない。",
    englishStem: "When the signal facing you is flashing yellow, you must proceed at slow speed.",
    mainCategoryId: "cat_road_signs",
    difficulty: "easy",
    correctChoiceKey: "F",
    explanationEn:
      "A flashing yellow signal does not itself require slow-speed driving. It means you must proceed with caution. A flashing red signal is the one that requires a full stop before moving on.",
    tagIds: ["tag_road_sign"]
  },
  {
    ref: "kamiike-4354-q3",
    originalStem: "青色の灯火の場合、すべての車は、直進し、左折し、右折することができる。",
    englishStem: "When the traffic light is green, every vehicle may go straight, turn left, or turn right.",
    mainCategoryId: "cat_lane_rules",
    difficulty: "medium",
    correctChoiceKey: "F",
    explanationEn:
      "This is false because the rule is not identical for every vehicle. The article points out that mopeds may be required to make a two-stage right turn instead of turning right in the same way as other vehicles.",
    tagIds: ["tag_turning_right"]
  },
  {
    ref: "kamiike-4354-q4",
    originalStem: "このような標識のあるところでは、標識の直前で一時停止しなければならない。",
    englishStem: "Where this sign is posted, you must stop immediately in front of the sign.",
    mainCategoryId: "cat_road_signs",
    difficulty: "easy",
    correctChoiceKey: "F",
    explanationEn:
      "You do not stop in front of the sign itself. You must stop immediately before the stop line, or just before the intersection when there is no stop line.",
    imageUrl: "https://www.kamiike.co.jp/cms_wp/wp-content/uploads/2024/01/ecfcf1769db0e0d0b12c02c0d10db3a5.png",
    imageAltTextEn: "Japanese stop sign shown in the source article.",
    imageCaptionEn: "Stop sign",
    tagIds: ["tag_stop_sign", "tag_stop", "tag_road_sign"]
  },
  {
    ref: "kamiike-4354-q5",
    originalStem: "この標識は追い越し禁止を表している。",
    englishStem: "This sign means overtaking is prohibited.",
    mainCategoryId: "cat_road_signs",
    difficulty: "medium",
    correctChoiceKey: "F",
    explanationEn:
      "The sign does not ban every kind of overtaking. It prohibits overtaking by crossing over to the right side of the road.",
    imageUrl: "https://www.kamiike.co.jp/cms_wp/wp-content/uploads/2024/01/be645befc2fb8c03f28e45b4f022df35.png",
    imageAltTextEn: "Japanese sign prohibiting overtaking by crossing to the right side of the road.",
    imageCaptionEn: "No overtaking by crossing to the right side",
    tagIds: ["tag_road_sign"]
  },
  {
    ref: "kamiike-4354-q6",
    originalStem: "この標識のあるところは、道路工事中であるため徐行して通行しなければならない。",
    englishStem: "This sign means road work is in progress, so you must drive at slow speed.",
    mainCategoryId: "cat_road_signs",
    difficulty: "easy",
    correctChoiceKey: "F",
    explanationEn:
      "This warning sign tells you to watch for road work. It does not, by itself, mean that you must always drive at slow speed there.",
    imageUrl: "https://www.kamiike.co.jp/cms_wp/wp-content/uploads/2024/01/dcca9c68c48d75f65c7479dcdbb58b47.png",
    imageAltTextEn: "Japanese road works warning sign shown in the source article.",
    imageCaptionEn: "Road works warning sign",
    tagIds: ["tag_road_sign"]
  },
  {
    ref: "kamiike-4354-q7",
    originalStem: "この標識のある区間内では、たとえ見通しの良い交差点であっても警音器を鳴らさなくてはいけない。",
    englishStem: "Within the section marked by this sign, you must sound the horn even at an intersection with good visibility.",
    mainCategoryId: "cat_road_signs",
    difficulty: "medium",
    correctChoiceKey: "F",
    explanationEn:
      "The horn is used where visibility is poor, such as at a blind curve. Good visibility at an intersection does not by itself require horn use just because this sign exists in the section.",
    imageUrl: "https://www.kamiike.co.jp/cms_wp/wp-content/uploads/2024/01/df2c4eb019355def1705bb3d86e0acb8.png",
    imageAltTextEn: "Japanese sound horn sign shown in the source article.",
    imageCaptionEn: "Sound horn sign",
    tagIds: ["tag_road_sign"]
  },
  {
    ref: "kamiike-4354-q8",
    originalStem: "中央線は、必ず道路の中心にひかれている。",
    englishStem: "A center line is always painted at the exact center of the road.",
    mainCategoryId: "cat_lane_rules",
    difficulty: "easy",
    correctChoiceKey: "F",
    explanationEn:
      "This statement is false because a center line is not always painted at the exact geometric center of the roadway. The wording is intended to mislead you with the phrase 'always' and with a subtle wording difference.",
    tagIds: []
  },
  {
    ref: "kamiike-4354-q9",
    originalStem: "上り坂の頂上付近やこう配の急な坂は、徐行すべき場所である。",
    englishStem: "Near the top of an uphill slope and on a steep slope, you must drive at slow speed.",
    mainCategoryId: "cat_speed_stopping",
    difficulty: "easy",
    correctChoiceKey: "F",
    explanationEn:
      "The tricky part is the slope description. Slow-speed driving is required near the top of a hill and on a steep downhill slope, not on every steep slope.",
    tagIds: []
  },
  {
    ref: "kamiike-4354-q10",
    originalStem:
      "交差点とその前後30メートル以内の場所は、優先道路を通行している場合を除き、追い越しが禁止されている。",
    englishStem:
      "At an intersection, and within 30 meters before and after it, overtaking is prohibited unless you are traveling on a priority road.",
    mainCategoryId: "cat_lane_rules",
    difficulty: "medium",
    correctChoiceKey: "F",
    explanationEn:
      "The rule is limited to the intersection itself and the area within 30 meters before it. The source article explains that 'before and after' is the trap; it is not 30 meters on both sides.",
    tagIds: ["tag_intersection", "tag_priority"]
  }
];

function normalizeText(value) {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
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

async function downloadImage(url, ref) {
  if (!url) {
    return null;
  }

  await fs.mkdir(PUBLIC_IMAGE_DIR, { recursive: true });
  const extension = path.extname(new URL(url).pathname) || ".png";
  const fileName = `${ref}${extension.toLowerCase()}`;
  const filePath = path.join(PUBLIC_IMAGE_DIR, fileName);
  const relativeAssetPath = `/question-images/kamiike-blog/${fileName}`;

  try {
    await fs.access(filePath);
    return relativeAssetPath;
  } catch {
    // Download when missing.
  }

  const buffer = await fetchBuffer(url);
  await fs.writeFile(filePath, buffer);

  return relativeAssetPath;
}

function ensureSourceReference(dataset, now) {
  const rightsNotes =
    "Imported from a public Kamiike Driving School blog article with manually rewritten English learner copy and locally downloaded sign images.";
  const existing = dataset.sourceReferences.find((sourceReference) => sourceReference.id === SOURCE_REFERENCE_ID);

  if (existing) {
    existing.sourceName = "Kamiike Driving School Blog: Trick Questions and Tips";
    existing.sourceType = "other";
    existing.sourceUrl = SOURCE_URL;
    existing.publisher = "上池自動車学校";
    existing.regionScope = "national";
    existing.originalLanguage = "ja";
    existing.rightsNotes = rightsNotes;
    existing.updatedAt = now;

    if (!existing.fetchedAt) {
      existing.fetchedAt = now;
    }

    return;
  }

  dataset.sourceReferences.push({
    id: SOURCE_REFERENCE_ID,
    sourceName: "Kamiike Driving School Blog: Trick Questions and Tips",
    sourceType: "other",
    sourceUrl: SOURCE_URL,
    publisher: "上池自動車学校",
    regionScope: "national",
    originalLanguage: "ja",
    fetchedAt: now,
    rightsNotes,
    createdAt: now,
    updatedAt: now
  });
}

function ensureQuestionTags(dataset, questionId, tagIds) {
  for (const tagId of tagIds) {
    const exists = dataset.questionTags.some(
      (questionTag) => questionTag.questionId === questionId && questionTag.tagId === tagId
    );

    if (!exists) {
      dataset.questionTags.push({ questionId, tagId });
    }
  }
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

  let addedQuestions = 0;
  let skippedDuplicates = 0;
  let backfilledImages = 0;

  for (const record of QUESTIONS) {
    const existingQuestion =
      existingQuestionsByRef.get(record.ref) ?? existingQuestionsByOriginalStem.get(normalizeText(record.originalStem));
    const imageAssetPath = await downloadImage(record.imageUrl, record.ref);

    if (existingQuestion) {
      if (!existingQuestion.hasImage && imageAssetPath) {
        existingQuestion.hasImage = true;
        existingQuestion.imageAssetPath = imageAssetPath;
        existingQuestion.imageAltTextEn = record.imageAltTextEn;
        existingQuestion.imageCaptionEn = record.imageCaptionEn;
        existingQuestion.updatedAt = now;
        backfilledImages += 1;
      }

      ensureQuestionTags(dataset, existingQuestion.id, record.tagIds);
      skippedDuplicates += 1;
      continue;
    }

    const questionId = nextEntityId("q", dataset.questions);
    const questionNumber = questionId.slice(2);
    const explanationId = `exp_${questionNumber}_v1`;

    dataset.questions.push({
      id: questionId,
      sourceReferenceId: SOURCE_REFERENCE_ID,
      contentVersionId: CONTENT_VERSION_ID,
      sourceQuestionRef: record.ref,
      questionType: "true_false",
      mainCategoryId: record.mainCategoryId,
      difficulty: record.difficulty,
      status: "published",
      originalStem: record.originalStem,
      originalLanguage: "ja",
      englishStem: record.englishStem,
      correctChoiceKey: record.correctChoiceKey,
      hasImage: Boolean(imageAssetPath),
      imageAssetPath: imageAssetPath ?? undefined,
      imageAltTextEn: imageAssetPath ? record.imageAltTextEn : undefined,
      imageCaptionEn: imageAssetPath ? record.imageCaptionEn : undefined,
      explanationOrigin: "source",
      activeExplanationId: explanationId,
      isExamEligible: true,
      publishedAt: now,
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
      bodyEn: record.explanationEn,
      sourceDerived: true,
      createdBy: "import-kamiike-blog-questions-script",
      createdAt: now,
      updatedAt: now
    });

    ensureQuestionTags(dataset, questionId, record.tagIds);

    existingQuestionsByRef.set(record.ref, dataset.questions[dataset.questions.length - 1]);
    existingQuestionsByOriginalStem.set(normalizeText(record.originalStem), dataset.questions[dataset.questions.length - 1]);
    addedQuestions += 1;
  }

  dataset.meta.generatedAt = now;
  dataset.meta.notes =
    "Sample fixture with synthetic MVP seed questions, JAF traffic-rules study prompts, the full JAF traffic quiz set, Car License Navi honmen question imports translated into English drafts, and Kamiike driving school trick-question imports.";

  dataset.sourceReferences.sort((left, right) => left.id.localeCompare(right.id));
  dataset.questions.sort((left, right) => left.id.localeCompare(right.id));
  dataset.choices.sort((left, right) => left.id.localeCompare(right.id));
  dataset.explanations.sort((left, right) => left.id.localeCompare(right.id));
  dataset.questionTags.sort((left, right) =>
    left.questionId.localeCompare(right.questionId) || left.tagId.localeCompare(right.tagId)
  );

  await fs.writeFile(DATASET_PATH, `${JSON.stringify(dataset, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        sourceUrl: SOURCE_URL,
        importedQuestions: QUESTIONS.length,
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
