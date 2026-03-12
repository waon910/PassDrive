export const ACCESS_COOKIE_NAME = "passdrive_access";
export const ACCESS_COOKIE_VALUE = "granted";

export function isAccessGateEnabled() {
  return Boolean(process.env.PASSDRIVE_APP_PASSWORD?.trim());
}

export function getAccessPassword() {
  return process.env.PASSDRIVE_APP_PASSWORD?.trim() ?? "";
}

export function isAuthorizedCookieValue(value: string | undefined) {
  return value === ACCESS_COOKIE_VALUE;
}

export function normalizeReturnPath(returnTo?: string | null) {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/";
  }

  if (returnTo === "/login" || returnTo.startsWith("/login?")) {
    return "/";
  }

  return returnTo;
}
