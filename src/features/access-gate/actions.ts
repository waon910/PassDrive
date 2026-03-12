"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_VALUE,
  getAccessPassword,
  isAccessGateEnabled,
  normalizeReturnPath
} from "@/lib/access-gate";

function buildCookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30
  };
}

export async function loginAction(formData: FormData) {
  if (!isAccessGateEnabled()) {
    redirect("/");
  }

  const passwordValue = formData.get("password");
  const returnToValue = formData.get("returnTo");
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const returnTo = normalizeReturnPath(typeof returnToValue === "string" ? returnToValue : "/");

  if (password !== getAccessPassword()) {
    redirect(`/login?error=invalid_password&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE_NAME, ACCESS_COOKIE_VALUE, buildCookieOptions());

  redirect(returnTo);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE_NAME);

  redirect("/login");
}
