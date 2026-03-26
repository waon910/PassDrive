"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canQuestionBePublished } from "@/domain/content-rules";
import { mutateContentDataset } from "@/lib/content-store";
import { getNowTimestamp } from "@/lib/sample-dataset-admin";

function requireString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing form field: ${fieldName}`);
  }

  return value;
}

function getRedirectTarget(formData: FormData, fallbackPath: string) {
  const value = formData.get("redirectTo");
  return typeof value === "string" && value.length > 0 ? value : fallbackPath;
}

function revalidateQuestionPaths(questionId: string) {
  revalidatePath("/");
  revalidatePath("/practice");
  revalidatePath("/mock-exam");
  revalidatePath("/mistakes");
  revalidatePath("/progress");
  revalidatePath("/admin/review");
  revalidatePath(`/admin/review/questions/${questionId}`);
}

function revalidateGlobalPaths() {
  revalidatePath("/");
  revalidatePath("/practice");
  revalidatePath("/mock-exam");
  revalidatePath("/mistakes");
  revalidatePath("/progress");
  revalidatePath("/admin/review");
}

async function unpublishQuestion(questionId: string, updatedAt: string) {
  await mutateContentDataset((dataset) => {
    const question = dataset.questions.find((item) => item.id === questionId);
    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }

    question.status = "unpublished";
    question.publishedAt = undefined;
    question.updatedAt = updatedAt;
  });
}

export async function publishQuestionAction(formData: FormData) {
  const questionId = requireString(formData.get("questionId"), "questionId");
  const redirectTarget = getRedirectTarget(formData, `/admin/review/questions/${questionId}`);
  const publishedAt = getNowTimestamp();

  await mutateContentDataset((dataset) => {
    const question = dataset.questions.find((item) => item.id === questionId);
    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }

    if (!canQuestionBePublished(question)) {
      throw new Error(`Question cannot be published yet: ${questionId}`);
    }

    question.status = "published";
    question.publishedAt = publishedAt;
    question.updatedAt = publishedAt;
  });

  revalidateQuestionPaths(questionId);
  redirect(redirectTarget);
}

export async function unpublishQuestionAction(formData: FormData) {
  const questionId = requireString(formData.get("questionId"), "questionId");
  const redirectTarget = getRedirectTarget(formData, `/admin/review/questions/${questionId}`);
  const updatedAt = getNowTimestamp();

  await unpublishQuestion(questionId, updatedAt);

  revalidateQuestionPaths(questionId);
  redirect(redirectTarget);
}

export async function unpublishQuestionInPlaceAction(questionId: string) {
  const updatedAt = getNowTimestamp();

  await unpublishQuestion(questionId, updatedAt);
  revalidateQuestionPaths(questionId);
}

export async function resetAdminReviewStateAction() {
  const resetAt = getNowTimestamp();

  await mutateContentDataset((dataset) => {
    for (const question of dataset.questions) {
      question.status = "published";
      question.publishedAt = resetAt;
      question.updatedAt = resetAt;
    }

    dataset.userProgress = [];
    dataset.examSessions = [];
    dataset.examSessionAnswers = [];
  });

  revalidateGlobalPaths();
}
