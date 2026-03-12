import Link from "next/link";

import { logoutAction } from "@/features/access-gate/actions";
import { isAccessGateEnabled } from "@/lib/access-gate";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/mock-exam", label: "Mock Exam" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/progress", label: "Progress" },
  { href: "/signs-terms", label: "Signs & Terms" },
  { href: "/admin/review", label: "Admin Review" }
];

interface AppShellProps {
  currentPath: string;
  eyebrow: string;
  title: string;
  description: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}

interface PrimaryNavigationProps {
  currentPath: string;
  showAccessGateControls: boolean;
}

function PrimaryNavigation({ currentPath, showAccessGateControls }: PrimaryNavigationProps) {
  return (
    <>
      <nav aria-label="Primary">
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
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

export function AppShell({ currentPath, eyebrow, title, description, meta, children }: AppShellProps) {
  const showAccessGateControls = isAccessGateEnabled();

  return (
    <main className="app-shell">
      <aside className="app-nav">
        <Link className="app-brand-mark" href="/">
          PassDrive
        </Link>

        <PrimaryNavigation currentPath={currentPath} showAccessGateControls={showAccessGateControls} />
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <Link className="app-brand-mark app-brand-mark-compact" href="/">
            PassDrive
          </Link>

          <details className="app-menu">
            <summary className="secondary-button app-menu-trigger">Menu</summary>
            <div className="app-menu-panel">
              <PrimaryNavigation currentPath={currentPath} showAccessGateControls={showAccessGateControls} />
            </div>
          </details>
        </header>

        <header className="page-hero">
          <div className="page-header-copy">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            {description ? <p className="page-description">{description}</p> : null}
          </div>
          {meta ? <div className="page-meta">{meta}</div> : null}
        </header>

        <div className="page-body">{children}</div>
      </div>
    </main>
  );
}
