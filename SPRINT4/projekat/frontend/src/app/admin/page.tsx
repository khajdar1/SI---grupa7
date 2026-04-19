export default function Page() {
  return (
    <div className="page stack">
      <section className="section-heading">
        <span className="section-kicker">Administration</span>
        <h1 className="section-title">Admin shell</h1>
        <p className="section-copy">
          The admin workspace will eventually cover user accounts, categories, SLA values, and audit visibility.
        </p>
      </section>

      <section className="split-grid">
        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <span className="section-kicker">User governance</span>
            <h2 className="section-title">Accounts and role control.</h2>
          </div>

          <ul className="quick-facts quick-facts--stacked">
            <li>Create or deactivate user accounts.</li>
            <li>Bind accounts to a company or organization.</li>
            <li>Adjust access according to the documented roles.</li>
          </ul>
        </article>

        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <span className="section-kicker">System tuning</span>
            <h2 className="section-title">Categories, SLA, and audit trail.</h2>
          </div>

          <div className="tag-row">
            {['Fault categories', 'SLA limits', 'Audit log', 'Disabled states'].map((item) => (
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