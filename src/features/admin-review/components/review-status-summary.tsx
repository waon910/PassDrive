interface ReviewStatusSummaryProps {
  summary: {
    unpublished: number;
    published: number;
  };
}

export function ReviewStatusSummary({ summary }: ReviewStatusSummaryProps) {
  const cards = [
    {
      label: "Unpublished",
      value: summary.unpublished,
      note: "Hidden from learner-facing routes."
    },
    {
      label: "Published",
      value: summary.published,
      note: "Visible in learner routes right now."
    }
  ];

  return (
    <section className="admin-review-summary">
      {cards.map((card) => (
        <article key={card.label} className="stat-card">
          <span className="meta-label">{card.label}</span>
          <strong>{card.value}</strong>
          <p className="stat-note">{card.note}</p>
        </article>
      ))}
    </section>
  );
}
