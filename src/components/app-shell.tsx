import Link from "next/link";

import { logoutAction } from "@/features/access-gate/actions";
import { isAccessGateEnabled } from "@/lib/access-gate";

const LEARNER_NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/mock-exam", label: "Mock Exam" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/progress", label: "Progress" },
  { href: "/signs-terms", label: "Signs & Terms" }
];

const ADMIN_NAV_ITEMS = [{ href: "/admin/review", label: "Admin Review" }];

interface AppShellProps {
  currentPath: string;
  eyebrow: string;
  title: string;
  description: string;
  meta?: React.ReactNode;
  shellVariant?: "default" | "study";
  children: React.ReactNode;
}

interface PrimaryNavigationProps {
  currentPath: string;
  items: { href: string; label: string }[];
  adminItems?: { href: string; label: string }[];
  showAccessGateControls: boolean;
}

function PrimaryNavigation({ currentPath, items, adminItems = [], showAccessGateControls }: PrimaryNavigationProps) {
  return (
    <>
      <nav aria-label="Primary">
        <ul className="nav-list">
          {items.map((item) => {
            const isActive = currentPath === item.href;

            return (
              <li key={item.href}>
                <Link className={isActive ? "nav-link active" : "nav-link"} href={item.href}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {adminItems.length > 0 ? (
        <div className="nav-secondary-group">
          <p className="small-copy nav-group-label">Admin</p>
          <nav aria-label="Admin">
            <ul className="nav-list">
              {adminItems.map((item) => {
                const isActive = currentPath === item.href;

                return (
                  <li key={item.href}>
                    <Link className={isActive ? "nav-link active" : "nav-link"} href={item.href}>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}

      {showAccessGateControls ? (
        <div className="app-nav-footer">
          <p className="small-copy nav-status">Shared access gate is active.</p>
          <form action={logoutAction}>
            <button className="secondary-button app-nav-button" type="submit">
              Log Out
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}

export function AppShell({
  currentPath,
  eyebrow,
  title,
  description,
  meta,
  shellVariant = "default",
  children
}: AppShellProps) {
  const showAccessGateControls = isAccessGateEnabled();

  return (
    <main className={shellVariant === "study" ? "app-shell app-shell-study" : "app-shell"}>
      <aside className="app-nav">
        <Link className="app-brand-mark" href="/">
          PassDrive
        </Link>

        <PrimaryNavigation
          currentPath={currentPath}
          items={LEARNER_NAV_ITEMS}
          adminItems={ADMIN_NAV_ITEMS}
          showAccessGateControls={showAccessGateControls}
        />
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-leading">
            <Link className="app-brand-mark app-brand-mark-compact" href="/">
              PassDrive
            </Link>
            <div className="app-topbar-copy">
              <span>{eyebrow}</span>
              <strong>{title}</strong>
            </div>
          </div>

          <details className="app-menu">
            <summary className="secondary-button app-menu-trigger">Menu</summary>
            <div className="app-menu-panel">
              <PrimaryNavigation
                currentPath={currentPath}
                items={LEARNER_NAV_ITEMS}
                adminItems={ADMIN_NAV_ITEMS}
                showAccessGateControls={showAccessGateControls}
              />
            </div>
          </details>
        </header>

        {shellVariant === "default" ? (
          <header className="page-hero">
            <div className="page-header-copy">
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              {description ? <p className="page-description">{description}</p> : null}
            </div>
            {meta ? <div className="page-meta">{meta}</div> : null}
          </header>
        ) : null}

        <div className="page-body">{children}</div>
      </div>
    </main>
  );
}
