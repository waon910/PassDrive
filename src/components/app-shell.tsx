import Link from "next/link";

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

export function AppShell({ currentPath, eyebrow, title, description, meta, children }: AppShellProps) {
  return (
    <main className="app-shell">
      <aside className="app-nav">
        <Link className="app-brand-mark" href="/">
          PassDrive
        </Link>

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
      </aside>

      <div className="app-main">
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
