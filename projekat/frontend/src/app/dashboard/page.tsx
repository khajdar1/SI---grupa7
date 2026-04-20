export default function Page() {
  const stats = [
    { label: 'Open interventions', value: '18' },
    { label: 'In progress', value: '09' },
    { label: 'Overdue', value: '02' },
    { label: 'Unread notifications', value: '06' },
  ];

  const activity = [
    'New fault report created from public intake form',
    'Coordinator changed priority for a critical intervention',
    'Technician updated status to in progress',
    'Admin adjusted SLA limits for urgent cases',
  ];

  return (
    <div className="page stack">
      <section className="section-heading">
        <span className="section-kicker">Operations view</span>
        <h1 className="section-title">Dashboard shell</h1>
        <p className="section-copy">
          This page will eventually aggregate the most relevant status signals for coordinators, management, and
          administrators.
        </p>
      </section>

      <section className="metric-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="metric-card metric-card--large">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="split-grid">
        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <span className="section-kicker">Recent activity</span>
            <h2 className="section-title">The event feed will mirror the audit trail.</h2>
          </div>

          <ul className="quick-facts quick-facts--stacked">
            {activity.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <span className="section-kicker">Target users</span>
            <h2 className="section-title">The same shell can surface different views by role.</h2>
          </div>

          <div className="tag-row">
            {['Coordinator', 'Technician', 'Management', 'Admin'].map((role) => (
              <span key={role} className="tag tag--muted">
                {role}
              </span>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}