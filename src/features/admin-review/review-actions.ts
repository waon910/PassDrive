"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canQuestionBePublished } from "@/domain/content-rules";
import type { ExplanationReview, Question, ReviewStatus, SourceReference, TranslationReview } from "@/domain/content-types";
import { mutateSampleDataset, getNowTimestamp } from "@/lib/sample-dataset-admin";
import { getQuestionBundleById, loadSampleDataset } from "@/lib/sample-dataset";

function requireString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing form field: ${fieldName}`);
  }

  return value;
}

function revalidateReviewPaths(questionId: string) {
  revalidatePath("/");
  revalidatePath("/practice");
  revalidatePath("/mock-exam");
  revalidatePath("/mistakes");
  revalidatePath("/progress");
  revalidatePath("/admin/review");
  revalidatePath(`/admin/review/questions/${questionId}`);
}

function updateQuestionStatus(question: Question, sourceReference: SourceReference) {
  if (
    question.translationReviewStatus === "approved" &&
    question.explanationReviewStatus === "approved" &&
    sourceReference.rightsStatus === "approved"
  ) {
    question.status = "ready";
    return;
  }

  if (question.translationReviewStatus === "approved") {
    question.status = "explanation_review";
    return;
  }

  if (question.translationReviewStatus === "changes_requested" || question.explanationReviewStatus === "changes_requested") {
    question.status = "draft";
    return;
  }

  question.status = "translation_review";
}

function updateTranslationReviewRecord(review: TranslationReview, status: ReviewStatus, notes: string, reviewedAt?: string) {
  review.status = status;
  review.accuracyCheck = status === "approved";
  review.naturalnessCheck = status === "approved";
  review.notes = notes;
  review.reviewedAt = reviewedAt;
}

function updateExplanationReviewRecord(review: ExplanationReview, status: ReviewStatus, notes: string, reviewedAt?: string) {
  review.status = status;
  review.accuracyCheck = status === "approved";
  review.clarityCheck = status === "approved";
  review.notes = notes;
  review.reviewedAt = reviewedAt;
}

export async function approveSourceRightsAction(formData: FormData) {
  const questionId = requireString(formData.get("questionId"), "questionId");
  const sourceReferenceId = requireString(formData.get("sourceReferenceId"), "sourceReferenceId");
  const reviewedAt = getNowTimestamp();

  await mutateSampleDataset((dataset) => {
    const sourceReference = dataset.sourceReferences.find((item) => item.id === sourceReferenceId);
    if (!sourceReference) {
      throw new Error(`Source reference not found: ${sourceReferenceId}`);
    }

    sourceReference.rightsStatus = "approved";
    sourceReference.lastVerifiedAt = reviewedAt;
    sourceReference.updatedAt = reviewedAt;
    sourceReference.rightsNotes = "Reviewed in admin UI and approved for publication workflow.";

    const relatedQuestions = dataset.questions.filter((item) => item.sourceReferenceId === sourceReferenceId);
    for (const question of relatedQuestions) {
      question.updatedAt = reviewedAt;
      updateQuestionStatus(question, sourceReference);
    }
  });

  revalidateReviewPaths(questionId);
  redirect(`/admin/review/questions/${questionId}`);
}

export async function requestSourceFollowUpAction(formData: FormData) {
  const questionId = requireString(formData.get("questionId"), "questionId");
  const sourceReferenceId = requireString(formData.get("sourceReferenceId"), "sourceReferenceId");
  const reviewedAt = getNowTimestamp();

  await mutateSampleDataset((dataset) => {
    const sourceReference = dataset.sourceReferences.find((item) => item.id === sourceReferenceId);
    if (!sourceReference) {
      throw new Error(`Source reference not found: ${sourceReferenceId}`);
    }

    sourceReference.rightsStatus = "review_required";
    sourceReference.lastVerifiedAt = reviewedAt;
    sourceReference.updatedAt = reviewedAt;
    sourceReference.rightsNotes = "Needs manual follow-up before publication.";
  });

  revalidateReviewPaths(questionId);
  redirect(`/admin/review/questions/${questionId}`);
}

export async function approveTranslationAction(formData: FormData) {
  const questionId = requireString(formData.get("questionId"), "questionId");
  const reviewedAt = getNowTimestamp();

  await mutateSampleDataset((dataset) => {
    const question = dataset.questions.find((item) => item.id === questionId);
    const review = dataset.translationReviews.find((item) => item.questionId === questionId);

    if (!question || !review) {
      throw new Error(`Translation review target not found: ${questionId}`);
    }

    const sourceReference = dataset.sourceReferences.find((item) => item.id === question.sourceReferenceId);
    if (!sourceReference) {
      throw new Error(`Source reference not found for question: ${questionId}`);
    }

    updateTranslationReviewRecord(review, "approved", "Approved in admin UI.", reviewedAt);
    question.translationReviewStatus = "approved";
    question.updatedAt = reviewedAt;
    updateQuestionStatus(question, sourceReference);
  });

  revalidateReviewPaths(questionId);
  redirect(`/admin/review/questions/${questionId}`);
}

export async function requestTranslationChangesAction(formData: FormData) {
  const questionId = requireString(formData.get("questionId"), "questionId");
  const reviewedAt = getNowTimestamp();

  await mutateSampleDataset((dataset) => {
    const question = dataset.questions.find((item) => item.id === questionId);
    const review = dataset.translationReviews.find((item) => item.questionId === questionId);

    if (!question || !review) {
      throw new Error(`Translation review target not found: ${questionId}`);
    }

    updateTranslationReviewRecord(review, "changes_requested", "Changes requested in admin UI.", reviewedAt);
    question.translationReviewStatus = "changes_requested";
    question.updatedAt = reviewedAt;
    question.status = "draft";
  });

  revalidateReviewPaths(questionId);
  redirect(`/admin/review/questions/${questionId}`);
}

export async function approveExplanationAction(formData: FormData) {
  const questionId = requireString(formData.get("questionId"), "questionId");
  const explanationId = requireString(formData.get("explanationId"), "explanationId");
  const reviewedAt = getNowTimestamp();

  await mutateSampleDataset((dataset) => {
    const question = dataset.questions.find((item) => item.id === questionId);
    const review = dataset.explanationReviews.find((item) => item.explanationId === explanationId);

    if (!question || !review) {
      throw new Error(`Explanation review target not found: ${questionId}`);
    }

    const sourceReference = dataset.sourceReferences.find((item) => item.id === question.sourceReferenceId);
    if (!sourceReference) {
      throw new Error(`Source reference not found for question: ${questionId}`);
    }

    updateExplanationReviewRecord(review, "approved", "Approved in admin UI.", reviewedAt);
    question.explanationReviewStatus = "approved";
    question.updatedAt = reviewedAt;
    updateQuestionStatus(question, sourceReference);
  });

  revalidateReviewPaths(questionId);
  redirect(`/admin/review/questions/${questionId}`);
}

export async function requestExplanationChangesAction(formData: FormData) {
  const questionId = requireString(formData.get("questionId"), "questionId");
  const explanationId = requireString(formData.get("explanationId"), "explanationId");
  const reviewedAt = getNowTimestamp();

  await mutateSampleDataset((dataset) => {
    const question = dataset.questions.find((item) => item.id === questionId);
    const review = dataset.explanationReviews.find((item) => item.explanationId === explanationId);

    if (!question || !review) {
      throw new Error(`Explanation review target not found: ${questionId}`);
    }

    updateExplanationReviewRecord(review, "changes_requested", "Changes requested in admin UI.", reviewedAt);
    question.explanationReviewStatus = "changes_requested";
    question.updatedAt = reviewedAt;
    question.status = "draft";
  });

  revalidateReviewPaths(questionId);
  redirect(`/admin/review/questions/${questionId}`);
}

export async function publishQuestionAction(formData: FormData) {
  const questionId = requireString(formData.get("questionId"), "questionId");
  const reviewedAt = getNowTimestamp();
  const dataset = await loadSampleDataset();
  const bundle = getQuestionBundleById(dataset, questionId);

  if (!bundle || !canQuestionBePublished(bundle.question, bundle.sourceReference)) {
    throw new Error(`Question cannot be published yet: ${questionId}`);
  }

  await mutateSampleDataset((mutableDataset) => {
    const question = mutableDataset.questions.find((item) => item.id === questionId);
    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }

    question.status = "published";
    question.publishedAt = reviewedAt;
    question.updatedAt = reviewedAt;
  });

  revalidateReviewPaths(questionId);
  redirect(`/admin/review/questions/${questionId}`);
}
