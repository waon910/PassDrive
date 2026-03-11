export interface StatItem {
  label: string;
  value: string | number;
  note?: string;
}

interface StatGridProps {
  items: StatItem[];
}

export function StatGrid({ items }: StatGridProps) {
  return (
    <section className="stats-grid" aria-label="Page metrics">
      {items.map((item) => (
        <article key={item.label} className="surface-card stat-card">
          <span className="metric-label">{item.label}</span>
          <strong>{item.value}</strong>
          {item.note ? <p className="stat-note">{item.note}</p> : null}
        </article>
      ))}
    </section>
  );
}
