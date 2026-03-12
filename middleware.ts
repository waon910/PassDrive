import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE_NAME, isAccessGateEnabled, isAuthorizedCookieValue } from "@/lib/access-gate";

const PUBLIC_PATH_PREFIXES = ["/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  if (!isAccessGateEnabled()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || pathname === "/login") {
    return NextResponse.next();
  }

  const accessCookie = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (isAuthorizedCookieValue(accessCookie)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/:path*"]
};
