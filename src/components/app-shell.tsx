import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/mock-exam", label: "Mock Exam" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/progress", label: "Progress" },
  { href: "/signs-terms", label: "Signs & Terms" }
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
        <div className="app-brand">
          <p className="app-brand-mark">PassDrive</p>
          <p className="app-brand-copy">Japanese license study, designed for English-first iPad use.</p>
        </div>

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

        <div className="nav-note">
          <span className="meta-label">Current build</span>
          <p>Validated against typed sample content and iPad-first route structure.</p>
        </div>
      </aside>

      <div className="app-main">
        <header className="page-hero">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="page-description">{description}</p>
          </div>
          {meta ? <div className="page-meta">{meta}</div> : null}
        </header>

        <div className="page-body">{children}</div>
      </div>
    </main>
  );
}
