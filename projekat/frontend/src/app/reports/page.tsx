const reportCards = [
  { label: 'Completed interventions', value: '127' },
  { label: 'Average closure time', value: '6.4h' },
  { label: 'Export ready', value: 'PDF' },
  { label: 'Historic filter layers', value: '3' },
];

export default function Page() {
  return (
    <div className="page stack">
      <section className="section-heading">
        <span className="section-kicker">Reporting</span>
        <h1 className="section-title">Reports shell</h1>
        <p className="section-copy">
          This route will collect operational reporting, history lookups, and export actions for coordinators and
          management.
        </p>
      </section>

      <section className="metric-grid">
        {reportCards.map((card) => (
          <article key={card.label} className="metric-card metric-card--large">
            <strong>{card.value}</strong>
            <span>{card.label}</span>
          </article>
        ))}
      </section>

      <article className="panel stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Delivery surface</span>
          <h2 className="section-title">A single place for history and export.</h2>
        </div>

        <div className="tag-row">
          {['History by location', 'History by device', 'PDF export', 'Management summary'].map((item) => (
            <span key={item} className="pill pill--warm">
              {item}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}