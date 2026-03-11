import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultFilePath = path.resolve(__dirname, "../data/samples/mvp-sample-question-set.json");
const inputFilePath = path.resolve(process.cwd(), process.argv[2] ?? defaultFilePath);

const requiredCollections = [
  "sourceReferences",
  "contentVersions",
  "categories",
  "tags",
  "questions",
  "choices",
  "explanations",
  "translationReviews",
  "explanationReviews",
  "questionTags",
  "userProgress",
  "examSessions",
  "examSessionAnswers",
  "glossaryTerms"
];

function fail(message) {
  throw new Error(message);
}

function ensureArrayCollections(data) {
  for (const key of requiredCollections) {
    if (!Array.isArray(data[key])) {
      fail(`Collection "${key}" must be an array.`);
    }
  }
}

function buildMap(records, entityName) {
  const map = new Map();

  for (const record of records) {
    if (typeof record.id !== "string" || record.id.length === 0) {
      fail(`${entityName} record is missing a non-empty "id".`);
    }
    if (map.has(record.id)) {
      fail(`${entityName} has a duplicate id: ${record.id}`);
    }
    map.set(record.id, record);
  }

  return map;
}

function groupByQuestionId(records) {
  const map = new Map();

  for (const record of records) {
    const list = map.get(record.questionId) ?? [];
    list.push(record);
    map.set(record.questionId, list);
  }

  return map;
}

function assertRecordExists(map, id, label) {
  if (!map.has(id)) {
    fail(`${label} references a missing id: ${id}`);
  }
}

const raw = fs.readFileSync(inputFilePath, "utf8");
const data = JSON.parse(raw);

ensureArrayCollections(data);

const sourceReferences = buildMap(data.sourceReferences, "SourceReference");
const contentVersions = buildMap(data.contentVersions, "ContentVersion");
const categories = buildMap(data.categories, "Category");
const tags = buildMap(data.tags, "Tag");
const questions = buildMap(data.questions, "Question");
const choices = buildMap(data.choices, "Choice");
const explanations = buildMap(data.explanations, "Explanation");
const translationReviews = buildMap(data.translationReviews, "TranslationReview");
const explanationReviews = buildMap(data.explanationReviews, "ExplanationReview");
const examSessions = buildMap(data.examSessions, "ExamSession");
const examSessionAnswers = buildMap(data.examSessionAnswers, "ExamSessionAnswer");
const glossaryTerms = buildMap(data.glossaryTerms, "GlossaryTerm");

const choicesByQuestionId = groupByQuestionId(data.choices);
const explanationsByQuestionId = groupByQuestionId(data.explanations);
const answersBySessionId = new Map();

for (const answer of data.examSessionAnswers) {
  const list = answersBySessionId.get(answer.examSessionId) ?? [];
  list.push(answer);
  answersBySessionId.set(answer.examSessionId, list);
}

for (const question of data.questions) {
  assertRecordExists(sourceReferences, question.sourceReferenceId, `Question ${question.id}`);
  assertRecordExists(contentVersions, question.contentVersionId, `Question ${question.id}`);
  assertRecordExists(categories, question.mainCategoryId, `Question ${question.id}`);

  const questionChoices = choicesByQuestionId.get(question.id) ?? [];
  if (questionChoices.length === 0) {
    fail(`Question ${question.id} must have at least one choice.`);
  }

  const matchingCorrectChoice = questionChoices.find(
    (choice) => choice.choiceKey === question.correctChoiceKey && choice.isCorrect === true
  );
  if (!matchingCorrectChoice) {
    fail(`Question ${question.id} has no correct choice matching correctChoiceKey.`);
  }

  const correctChoices = questionChoices.filter((choice) => choice.isCorrect === true);
  if (correctChoices.length !== 1) {
    fail(`Question ${question.id} must have exactly one correct choice in this MVP schema.`);
  }

  assertRecordExists(explanations, question.activeExplanationId, `Question ${question.id}`);
  const activeExplanation = explanations.get(question.activeExplanationId);
  if (activeExplanation.questionId !== question.id) {
    fail(`Question ${question.id} points to an explanation that belongs to another question.`);
  }
  if (activeExplanation.origin !== question.explanationOrigin) {
    fail(`Question ${question.id} explanationOrigin does not match its active explanation.`);
  }

  if (question.status === "published") {
    const source = sourceReferences.get(question.sourceReferenceId);
    if (question.translationReviewStatus !== "approved") {
      fail(`Published question ${question.id} must have translationReviewStatus=approved.`);
    }
    if (question.explanationReviewStatus !== "approved") {
      fail(`Published question ${question.id} must have explanationReviewStatus=approved.`);
    }
    if (source.rightsStatus !== "approved") {
      fail(`Published question ${question.id} must point to an approved source reference.`);
    }
  }

  const questionExplanations = explanationsByQuestionId.get(question.id) ?? [];
  if (!questionExplanations.some((explanation) => explanation.id === question.activeExplanationId)) {
    fail(`Question ${question.id} active explanation is not included in its explanation collection.`);
  }
}

for (const choice of data.choices) {
  assertRecordExists(questions, choice.questionId, `Choice ${choice.id}`);
}

for (const explanation of data.explanations) {
  assertRecordExists(questions, explanation.questionId, `Explanation ${explanation.id}`);
}

for (const review of data.translationReviews) {
  assertRecordExists(questions, review.questionId, `TranslationReview ${review.id}`);
}

for (const review of data.explanationReviews) {
  assertRecordExists(explanations, review.explanationId, `ExplanationReview ${review.id}`);
}

for (const mapping of data.questionTags) {
  assertRecordExists(questions, mapping.questionId, "QuestionTag");
  assertRecordExists(tags, mapping.tagId, "QuestionTag");
}

for (const progress of data.userProgress) {
  assertRecordExists(questions, progress.questionId, `UserProgress for learner ${progress.learnerId}`);
  if (progress.attemptsTotal !== progress.correctTotal + progress.incorrectTotal) {
    fail(`UserProgress for question ${progress.questionId} has inconsistent attempt totals.`);
  }
}

for (const session of data.examSessions) {
  assertRecordExists(contentVersions, session.contentVersionId, `ExamSession ${session.id}`);
  const sessionAnswers = answersBySessionId.get(session.id) ?? [];
  if (sessionAnswers.length !== session.questionCount) {
    fail(`ExamSession ${session.id} questionCount does not match its answer count.`);
  }

  const computedCorrectCount = sessionAnswers.filter((answer) => answer.isCorrect).length;
  if (session.correctCount !== computedCorrectCount) {
    fail(`ExamSession ${session.id} correctCount does not match its answers.`);
  }

  const computedScorePercent = session.questionCount === 0 ? 0 : (computedCorrectCount / session.questionCount) * 100;
  if (session.scorePercent !== computedScorePercent) {
    fail(`ExamSession ${session.id} scorePercent does not match its answers.`);
  }
}

for (const answer of data.examSessionAnswers) {
  assertRecordExists(examSessions, answer.examSessionId, `ExamSessionAnswer ${answer.id}`);
  assertRecordExists(questions, answer.questionId, `ExamSessionAnswer ${answer.id}`);

  const questionChoices = choicesByQuestionId.get(answer.questionId) ?? [];
  const selectedChoice = questionChoices.find((choice) => choice.choiceKey === answer.selectedChoiceKey);
  if (!selectedChoice) {
    fail(`ExamSessionAnswer ${answer.id} selectedChoiceKey does not exist on its question.`);
  }
  if (selectedChoice.isCorrect !== answer.isCorrect) {
    fail(`ExamSessionAnswer ${answer.id} isCorrect does not match the selected choice.`);
  }
}

for (const term of data.glossaryTerms) {
  if (term.relatedCategoryId) {
    assertRecordExists(categories, term.relatedCategoryId, `GlossaryTerm ${term.id}`);
  }
}

for (const review of data.translationReviews) {
  const question = questions.get(review.questionId);
  if (question.translationReviewStatus !== review.status) {
    fail(`Question ${question.id} translationReviewStatus does not match its review record.`);
  }
}

for (const review of data.explanationReviews) {
  const explanation = explanations.get(review.explanationId);
  const question = questions.get(explanation.questionId);
  if (question.explanationReviewStatus !== review.status) {
    fail(`Question ${question.id} explanationReviewStatus does not match its review record.`);
  }
}

console.log(`Validation passed for ${inputFilePath}`);
console.log(
  JSON.stringify(
    {
      sourceReferences: data.sourceReferences.length,
      contentVersions: data.contentVersions.length,
      categories: data.categories.length,
      tags: data.tags.length,
      questions: data.questions.length,
      choices: data.choices.length,
      explanations: data.explanations.length,
      translationReviews: data.translationReviews.length,
      explanationReviews: data.explanationReviews.length,
      questionTags: data.questionTags.length,
      userProgress: data.userProgress.length,
      examSessions: data.examSessions.length,
      examSessionAnswers: data.examSessionAnswers.length,
      glossaryTerms: data.glossaryTerms.length
    },
    null,
    2
  )
);
