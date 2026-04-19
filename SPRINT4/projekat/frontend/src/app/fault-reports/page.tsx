import Link from 'next/link';

export default function Page() {
  return (
    <section className="page stack">
      <article className="panel stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Core intake</span>
          <h1 className="section-title">Fault report shell</h1>
          <p className="section-copy">
            This route will cover category selection, contact data, attachments, and automatic handoff into the
            intervention workflow described in the use cases.
          </p>
        </div>

        <div className="tag-row">
          <span className="tag">PBI-003</span>
          <span className="tag">Auto routing</span>
          <span className="tag">Attachments</span>
          <span className="tag">Location capture</span>
        </div>

        <div className="button-row">
          <Link className="button button--solid" href="/interventions">
            View interventions
          </Link>
          <Link className="button button--ghost" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </article>
    </section>
  );
}