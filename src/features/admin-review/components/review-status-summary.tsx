interface ReviewStatusSummaryProps {
  summary: {
    needsSourceReview: number;
    needsTranslationReview: number;
    needsExplanationReview: number;
    readyToPublish: number;
    published: number;
  };
}

export function ReviewStatusSummary({ summary }: ReviewStatusSummaryProps) {
  const cards = [
    {
      label: "Needs source review",
      value: summary.needsSourceReview,
      note: "Rights and reuse checks still pending."
    },
    {
      label: "Needs translation review",
      value: summary.needsTranslationReview,
      note: "English wording has not been approved yet."
    },
    {
      label: "Needs explanation review",
      value: summary.needsExplanationReview,
      note: "Explanation still needs a final content pass."
    },
    {
      label: "Ready to publish",
      value: summary.readyToPublish,
      note: "All checks passed. Publication can be enabled."
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
