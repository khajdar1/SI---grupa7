import Link from 'next/link';

export default function Page() {
  return (
    <section className="page stack">
      <article className="panel stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Audit trail</span>
          <h1 className="section-title">History shell</h1>
          <p className="section-copy">
            This screen will present status changes, ownership changes, and the timeline of each intervention or
            ticket.
          </p>
        </div>

        <div className="tag-row">
          <span className="tag">PBI-011</span>
          <span className="tag">Status history</span>
          <span className="tag">Timeline</span>
        </div>

        <div className="button-row">
          <Link className="button button--solid" href="/reports">
            View reports
          </Link>
          <Link className="button button--ghost" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </article>
    </section>
  );
}