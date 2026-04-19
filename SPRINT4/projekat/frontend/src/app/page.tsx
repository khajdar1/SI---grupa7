import Link from 'next/link';

export default function Page() {
  const capabilityCards = [
    {
      title: 'Fault intake',
      description: 'Anonymous or logged-in fault reporting with categories, attachments, and auto location capture.',
    },
    {
      title: 'Dispatch',
      description: 'Coordinator workflow for priority ranking, team assignment, and workload balancing.',
    },
    {
      title: 'Operations',
      description: 'Status tracking, intervention history, reports, and a clear audit trail for every change.',
    },
    {
      title: 'Control plane',
      description: 'User management, company segregation, SLA rules, and notification flow from one place.',
    },
  ];

  const stackPills = ['Next.js', 'React', 'Express', 'TypeScript', 'MySQL', 'Socket.IO'];

  return (
    <div className="page stack">
      <section className="hero panel">
        <div className="hero-copy">
          <span className="pill pill--teal">Sprint 4 skeleton</span>
          <h1 className="hero-title">A structured launchpad for service intervention management.</h1>
          <p className="lead">
            The repository is now split into a Next.js frontend and a modular Express backend so the team can move from
            documentation to implementation without reshaping the repo again.
          </p>

          <div className="button-row">
            <Link className="button button--solid" href="/login">
              Open login shell
            </Link>
            <Link className="button button--ghost" href="/fault-reports">
              Open fault report shell
            </Link>
            <Link className="button button--ghost" href="/dashboard">
              Inspect the dashboard shell
            </Link>
          </div>

          <ul className="quick-facts">
            <li>Project scope follows the backlog, use-case model, and architecture overview.</li>
            <li>Backend modules mirror the core MVP and near-term extensions.</li>
            <li>MySQL is wired through Docker Compose for local development.</li>
          </ul>
        </div>

        <aside className="hero-panel">
          <div className="metric-grid metric-grid--compact">
            <article className="metric-card">
              <strong>05</strong>
              <span>core MVP streams</span>
            </article>
            <article className="metric-card">
              <strong>21</strong>
              <span>backend module routes</span>
            </article>
            <article className="metric-card">
              <strong>02</strong>
              <span>workspaces in the monorepo</span>
            </article>
            <article className="metric-card">
              <strong>01</strong>
              <span>shared DB and runtime setup</span>
            </article>
          </div>

          <div className="panel panel--soft stack-tight">
            <div className="section-heading section-heading--compact">
              <span className="section-kicker">Project signal</span>
              <h2 className="section-title">Built around the roles from the documentation</h2>
            </div>
            <div className="tag-row">
              {['Citizen', 'Legal entity', 'Technician', 'Coordinator', 'Admin', 'Management'].map((role) => (
                <span key={role} className="tag">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="section-heading">
          <span className="section-kicker">Core modules</span>
          <h2 className="section-title">The skeleton already reflects the real system boundaries.</h2>
          <p className="section-copy">
            Every card below corresponds to a block already described in the sprint documents, so the code base stays
            aligned with the analysis and planning work.
          </p>
        </div>

        <div className="card-grid">
          {capabilityCards.map((card) => (
            <article key={card.title} className="info-card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="split-grid">
        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <span className="section-kicker">Technical setup</span>
            <h2 className="section-title">A clean base for the next sprint.</h2>
          </div>

          <div className="tag-row">
            {stackPills.map((item) => (
              <span key={item} className="pill pill--warm">
                {item}
              </span>
            ))}
          </div>

          <p className="section-copy">
            The frontend uses Next.js App Router and React, while the backend exposes a typed Express setup, MySQL
            connection pool, and a Socket.IO entry point for real-time notification work.
          </p>
        </article>

        <article className="panel stack-tight">
          <div className="section-heading section-heading--compact">
            <span className="section-kicker">Next implementation slices</span>
            <h2 className="section-title">The repo is ready for feature work.</h2>
          </div>

          <ol className="ordered-list">
            <li>Authentication and registration flows</li>
            <li>Fault reporting and intervention creation</li>
            <li>Dispatch, status updates, and reporting</li>
            <li>User administration, SLA rules, and audit history</li>
          </ol>
        </article>
      </section>
    </div>
  );
}