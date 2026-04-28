export const runtime = 'edge';
export default function Page() {
  const ranking = [
    'Technician 01 - 2 active interventions',
    'Technician 02 - 4 active interventions',
    'Technician 03 - 6 active interventions',
  ];

  return (
    <div className="page stack">
      <section className="section-heading">
        <span className="section-kicker">Dispatch planning</span>
        <h1 className="section-title">Assignments shell</h1>
        <p className="section-copy">
          The future screen will balance available technicians, manual overrides, and automated assignment rules.
        </p>
      </section>

      <section className="split-grid">
        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <span className="section-kicker">Technician load</span>
            <h2 className="section-title">Lower workload appears first.</h2>
          </div>

          <ul className="ordered-list ordered-list--compact">
            {ranking.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <span className="section-kicker">Assignment tools</span>
            <h2 className="section-title">Manual and automatic dispatch will live here.</h2>
          </div>

          <div className="tag-row">
            {['Manual override', 'Auto assign', 'Multi-assignee', 'Load-aware'].map((item) => (
              <span key={item} className="tag tag--muted">
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}