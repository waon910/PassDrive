import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { loginAction } from "@/features/access-gate/actions";
import {
  ACCESS_COOKIE_NAME,
  isAccessGateEnabled,
  isAuthorizedCookieValue,
  normalizeReturnPath
} from "@/lib/access-gate";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (!isAccessGateEnabled()) {
    redirect("/");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const returnTo = normalizeReturnPath(
    typeof resolvedSearchParams.returnTo === "string" ? resolvedSearchParams.returnTo : "/"
  );
  const hasError = resolvedSearchParams.error === "invalid_password";
  const cookieStore = await cookies();

  if (isAuthorizedCookieValue(cookieStore.get(ACCESS_COOKIE_NAME)?.value)) {
    redirect(returnTo);
  }

  return (
    <main className="password-gate">
      <section className="password-gate-card">
        <div>
          <p className="eyebrow">Shared Access</p>
          <h1>Enter the site password.</h1>
          <p className="page-description">
            This is a lightweight gate for invited testers. Learning history still stays on this device.
          </p>
        </div>

        <form action={loginAction} className="password-gate-form">
          <input type="hidden" name="returnTo" value={returnTo} />

          <label className="search-field" htmlFor="password">
            <span className="field-label">Password</span>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Shared password"
              required
            />
          </label>

          {hasError ? <p className="form-error">The password did not match.</p> : null}

          <button className="primary-button" type="submit">
            Enter PassDrive
          </button>
        </form>
      </section>
    </main>
  );
}
