import fs from "node:fs/promises";
import path from "node:path";

const DATASET_PATH = path.resolve(process.cwd(), "data/samples/mvp-sample-question-set.json");
const PUBLIC_IMAGE_DIR = path.resolve(process.cwd(), "public/question-images/jaf-quiz");

const SOURCE_PAGES = [
  {
    slug: "pedestrian",
    sourceId: "src_008",
    sourceName: "JAF Safe Driving Quiz: For Pedestrians",
    sourceUrl: "https://english.jaf.or.jp/safe-driving/quiz/pedestrian"
  },
  {
    slug: "bicycles",
    sourceId: "src_009",
    sourceName: "JAF Safe Driving Quiz: For Bicycles",
    sourceUrl: "https://english.jaf.or.jp/safe-driving/quiz/bicycles"
  },
  {
    slug: "motorcycles",
    sourceId: "src_010",
    sourceName: "JAF Safe Driving Quiz: For Motorcycles",
    sourceUrl: "https://english.jaf.or.jp/safe-driving/quiz/motorcycles"
  },
  {
    slug: "motorvehicles",
    sourceId: "src_005",
    sourceName: "JAF Safe Driving Quiz: For Motor Vehicles",
    sourceUrl: "https://english.jaf.or.jp/safe-driving/quiz/motorvehicles"
  },
  {
    slug: "parkinglot",
    sourceId: "src_006",
    sourceName: "JAF Safe Driving Quiz: For Parking Lot",
    sourceUrl: "https://english.jaf.or.jp/safe-driving/quiz/parkinglot"
  }
];

const CATEGORY_BY_REF = {
  "pedestrian-01": "cat_pedestrians_bicycles",
  "pedestrian-02": "cat_pedestrians_bicycles",
  "pedestrian-03": "cat_pedestrians_bicycles",
  "bicycles-01": "cat_road_signs",
  "bicycles-02": "cat_pedestrians_bicycles",
  "bicycles-03": "cat_road_signs",
  "bicycles-04": "cat_safety_checks",
  "bicycles-05": "cat_safety_checks",
  "motorcycles-01": "cat_safety_checks",
  "motorcycles-02": "cat_lane_rules",
  "motorvehicles-01": "cat_right_of_way",
  "motorvehicles-02": "cat_speed_stopping",
  "motorvehicles-03": "cat_parking_stopping",
  "motorvehicles-04": "cat_railroad_crossings",
  "motorvehicles-05": "cat_safety_checks",
  "motorvehicles-06": "cat_speed_stopping",
  "motorvehicles-07": "cat_lane_rules",
  "motorvehicles-08": "cat_lane_rules",
  "motorvehicles-09": "cat_lane_rules",
  "parkinglot-01": "cat_parking_stopping",
  "parkinglot-02": "cat_parking_stopping",
  "parkinglot-03": "cat_parking_stopping"
};

const DIFFICULTY_BY_REF = {
  "pedestrian-01": "easy",
  "pedestrian-02": "easy",
  "pedestrian-03": "easy",
  "bicycles-01": "easy",
  "bicycles-02": "medium",
  "bicycles-03": "easy",
  "bicycles-04": "easy",
  "bicycles-05": "easy",
  "motorcycles-01": "medium",
  "motorcycles-02": "hard",
  "motorvehicles-01": "medium",
  "motorvehicles-02": "easy",
  "motorvehicles-03": "easy",
  "motorvehicles-04": "easy",
  "motorvehicles-05": "easy",
  "motorvehicles-06": "medium",
  "motorvehicles-07": "hard",
  "motorvehicles-08": "medium",
  "motorvehicles-09": "medium",
  "parkinglot-01": "medium",
  "parkinglot-02": "easy",
  "parkinglot-03": "easy"
};

const QUESTION_TAGS_BY_REF = {
  "pedestrian-01": ["tag_crosswalk", "tag_pedestrian"],
  "pedestrian-02": ["tag_crosswalk", "tag_pedestrian"],
  "pedestrian-03": ["tag_pedestrian"],
  "bicycles-03": ["tag_stop_sign"],
  "motorvehicles-03": ["tag_stop_sign"],
  "motorvehicles-04": ["tag_level_crossing"],
  "motorvehicles-08": ["tag_expressway", "tag_passing_lane"],
  "parkinglot-01": ["tag_on_street_parking"],
  "parkinglot-02": ["tag_front_end_parking"],
  "parkinglot-03": ["tag_disabled_parking"],
  "motorvehicles-05": ["tag_seatbelt", "tag_safety_check"]
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

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function buildAbsoluteUrl(relativeOrAbsoluteUrl) {
  return new URL(relativeOrAbsoluteUrl, "https://english.jaf.or.jp").toString();
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

function buildModalMap(html) {
  const modalRegex =
    /<div class="modal fade" id="Modal(\d+)"[\s\S]*?<span class="t-cell-t">(Correct|Incorrect)<\/span>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g;
  const modalMap = new Map();

  for (const match of html.matchAll(modalRegex)) {
    const modalId = match[1];
    const correctness = match[2];
    const body = match[3];
    const paragraphMatches = [...body.matchAll(/<p class="[^"]*">([\s\S]*?)<\/p>/g)];
    const explanation = paragraphMatches.map((paragraphMatch) => stripTags(paragraphMatch[1])).join(" ").trim();

    modalMap.set(modalId, {
      isCorrect: correctness === "Correct",
      explanation
    });
  }

  return modalMap;
}

function parseQuestions(html, slug) {
  const modalMap = buildModalMap(html);
  const sectionRegex =
    /<h2 class="heading-primary[^"]*" id="(\d+)">([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2 class="heading-primary|<!--\s*(?:モーダル|modal))/g;
  const questions = [];

  for (const match of html.matchAll(sectionRegex)) {
    const questionNumber = match[1];
    const title = stripTags(match[2]);
    const body = match[3];
    const imageMatch = body.match(/<figure><img src="([^"]+)"/);
    const promptMatch = body.match(/<p><b>([\s\S]*?)<\/b><\/p>/);
    const optionMatches = [...body.matchAll(/data-target="#Modal(\d+)"><span>([\s\S]*?)<\/span><\/button>/g)];

    if (!promptMatch || optionMatches.length !== 2) {
      throw new Error(`Could not parse question ${slug}-${questionNumber}`);
    }

    const choices = optionMatches.map((optionMatch, index) => {
      const modal = modalMap.get(optionMatch[1]);
      if (!modal) {
        throw new Error(`Missing modal ${optionMatch[1]} for ${slug}-${questionNumber}`);
      }

      return {
        choiceKey: index === 0 ? "A" : "B",
        englishText: stripTags(optionMatch[2]),
        isCorrect: modal.isCorrect,
        explanation: modal.explanation
      };
    });

    const correctChoice = choices.find((choice) => choice.isCorrect);
    if (!correctChoice) {
      throw new Error(`No correct choice for ${slug}-${questionNumber}`);
    }

    questions.push({
      ref: `${slug}-${questionNumber}`,
      title,
      originalStem: stripTags(promptMatch[1]),
      imageUrl: imageMatch ? buildAbsoluteUrl(imageMatch[1]) : null,
      choices,
      explanation: correctChoice.explanation
    });
  }

  return questions;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "PassDrive importer/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function downloadImage(url, ref) {
  if (!url) {
    return null;
  }

  await fs.mkdir(PUBLIC_IMAGE_DIR, { recursive: true });
  const urlObject = new URL(url);
  const extension = path.extname(urlObject.pathname) || ".jpg";
  const fileName = `${ref}${extension.toLowerCase()}`;
  const relativeAssetPath = `/question-images/jaf-quiz/${fileName}`;
  const filePath = path.join(PUBLIC_IMAGE_DIR, fileName);

  try {
    await fs.access(filePath);
    return relativeAssetPath;
  } catch {
    // Continue and download when the file is missing.
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "PassDrive importer/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download image ${url}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  return relativeAssetPath;
}

function ensureSourceReference(dataset, sourcePage, fetchedAt) {
  const existing = dataset.sourceReferences.find((sourceReference) => sourceReference.id === sourcePage.sourceId);
  const genericRightsNotes =
    "Imported from a public JAF quiz page. Local image assets were downloaded for review only. Manual rights review is required before publication.";

  if (existing) {
    existing.sourceName = sourcePage.sourceName;
    existing.sourceType = "other";
    existing.sourceUrl = sourcePage.sourceUrl;
    existing.publisher = "Japan Automobile Federation (JAF)";
    existing.regionScope = "national";
    existing.originalLanguage = "en";
    existing.rightsStatus = "review_required";
    existing.rightsNotes = genericRightsNotes;
    existing.lastVerifiedAt = fetchedAt;
    existing.updatedAt = fetchedAt;

    if (!existing.fetchedAt) {
      existing.fetchedAt = fetchedAt;
    }

    return;
  }

  dataset.sourceReferences.push({
    id: sourcePage.sourceId,
    sourceName: sourcePage.sourceName,
    sourceType: "other",
    sourceUrl: sourcePage.sourceUrl,
    publisher: "Japan Automobile Federation (JAF)",
    regionScope: "national",
    originalLanguage: "en",
    fetchedAt,
    rightsStatus: "review_required",
    rightsNotes: genericRightsNotes,
    lastVerifiedAt: fetchedAt,
    createdAt: fetchedAt,
    updatedAt: fetchedAt
  });
}

function ensureQuestionTags(dataset, questionId, ref) {
  const tagIds = QUESTION_TAGS_BY_REF[ref] ?? [];
  for (const tagId of tagIds) {
    const alreadyExists = dataset.questionTags.some(
      (questionTag) => questionTag.questionId === questionId && questionTag.tagId === tagId
    );
    if (!alreadyExists) {
      dataset.questionTags.push({ questionId, tagId });
    }
  }
}

function buildImageAltText(title) {
  return `JAF quiz illustration for ${title}.`;
}

async function main() {
  const raw = await fs.readFile(DATASET_PATH, "utf8");
  const dataset = JSON.parse(raw);
  const now = new Date().toISOString();
  const existingQuestionsByRef = new Map(
    dataset.questions
      .filter((question) => typeof question.sourceQuestionRef === "string" && question.sourceQuestionRef.length > 0)
      .map((question) => [question.sourceQuestionRef, question])
  );
  const existingQuestionsByStem = new Map(
    dataset.questions.flatMap((question) => [
      [normalizeText(question.originalStem), question],
      [normalizeText(question.englishStem), question]
    ])
  );

  let addedQuestions = 0;
  let backfilledImages = 0;

  for (const sourcePage of SOURCE_PAGES) {
    ensureSourceReference(dataset, sourcePage, now);
    const html = await fetchHtml(sourcePage.sourceUrl);
    const parsedQuestions = parseQuestions(html, sourcePage.slug);

    for (const parsedQuestion of parsedQuestions) {
      const existingQuestion =
        existingQuestionsByRef.get(parsedQuestion.ref) ?? existingQuestionsByStem.get(normalizeText(parsedQuestion.originalStem));
      const imageAssetPath = await downloadImage(parsedQuestion.imageUrl, parsedQuestion.ref);

      if (existingQuestion) {
        if (!existingQuestion.hasImage && imageAssetPath) {
          existingQuestion.hasImage = true;
          existingQuestion.imageAssetPath = imageAssetPath;
          existingQuestion.imageAltTextEn = buildImageAltText(parsedQuestion.title);
          existingQuestion.imageCaptionEn = parsedQuestion.title;
          existingQuestion.updatedAt = now;
          backfilledImages += 1;
        }

        ensureQuestionTags(dataset, existingQuestion.id, parsedQuestion.ref);
        continue;
      }

      const questionId = nextEntityId("q", dataset.questions);
      const questionNumber = questionId.slice(2);
      const explanationId = `exp_${questionNumber}_v1`;
      const translationReviewId = `tr_${questionNumber}_v1`;
      const explanationReviewId = `er_${questionNumber}_v1`;

      dataset.questions.push({
        id: questionId,
        sourceReferenceId: sourcePage.sourceId,
        contentVersionId: "cv_2026_03_11",
        sourceQuestionRef: parsedQuestion.ref,
        questionType: "single_choice",
        mainCategoryId: CATEGORY_BY_REF[parsedQuestion.ref] ?? "cat_safety_checks",
        difficulty: DIFFICULTY_BY_REF[parsedQuestion.ref] ?? "medium",
        status: "translation_review",
        originalStem: parsedQuestion.originalStem,
        originalLanguage: "en",
        englishStem: parsedQuestion.originalStem,
        correctChoiceKey: parsedQuestion.choices.find((choice) => choice.isCorrect).choiceKey,
        hasImage: Boolean(imageAssetPath),
        imageAssetPath: imageAssetPath ?? undefined,
        imageAltTextEn: imageAssetPath ? buildImageAltText(parsedQuestion.title) : undefined,
        imageCaptionEn: imageAssetPath ? parsedQuestion.title : undefined,
        explanationOrigin: "source",
        activeExplanationId: explanationId,
        translationReviewStatus: "pending",
        explanationReviewStatus: "pending",
        isExamEligible: true,
        createdAt: now,
        updatedAt: now
      });

      dataset.choices.push(
        ...parsedQuestion.choices.map((choice, index) => ({
          id: `ch_${questionNumber}_${choice.choiceKey.toLowerCase()}`,
          questionId,
          choiceKey: choice.choiceKey,
          displayOrder: index + 1,
          englishText: choice.englishText,
          isCorrect: choice.isCorrect
        }))
      );

      dataset.explanations.push({
        id: explanationId,
        questionId,
        origin: "source",
        bodyEn: parsedQuestion.explanation,
        sourceDerived: true,
        createdBy: "import-jaf-quiz-script",
        createdAt: now,
        updatedAt: now
      });

      dataset.translationReviews.push({
        id: translationReviewId,
        questionId,
        reviewer: "pending-jaf-import-review",
        status: "pending",
        accuracyCheck: false,
        naturalnessCheck: false
      });

      dataset.explanationReviews.push({
        id: explanationReviewId,
        explanationId,
        reviewer: "pending-jaf-import-review",
        status: "pending",
        accuracyCheck: false,
        clarityCheck: false
      });

      ensureQuestionTags(dataset, questionId, parsedQuestion.ref);

      existingQuestionsByRef.set(parsedQuestion.ref, dataset.questions[dataset.questions.length - 1]);
      existingQuestionsByStem.set(normalizeText(parsedQuestion.originalStem), dataset.questions[dataset.questions.length - 1]);
      addedQuestions += 1;
    }
  }

  dataset.meta.generatedAt = now;
  dataset.meta.notes =
    "Sample fixture with synthetic MVP seed questions, JAF traffic-rules study prompts, and the full JAF Japan Traffic Rules Training quiz set with locally downloaded figure assets. All JAF-derived items remain blocked behind manual rights and review checks.";

  dataset.sourceReferences.sort((left, right) => left.id.localeCompare(right.id));
  dataset.questions.sort((left, right) => left.id.localeCompare(right.id));
  dataset.choices.sort((left, right) => left.id.localeCompare(right.id));
  dataset.explanations.sort((left, right) => left.id.localeCompare(right.id));
  dataset.translationReviews.sort((left, right) => left.id.localeCompare(right.id));
  dataset.explanationReviews.sort((left, right) => left.id.localeCompare(right.id));
  dataset.questionTags.sort((left, right) =>
    left.questionId === right.questionId
      ? left.tagId.localeCompare(right.tagId)
      : left.questionId.localeCompare(right.questionId)
  );

  await fs.writeFile(DATASET_PATH, `${JSON.stringify(dataset, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        addedQuestions,
        backfilledImages,
        totalQuestions: dataset.questions.length
      },
      null,
      2
    )
  );
}

await main();
