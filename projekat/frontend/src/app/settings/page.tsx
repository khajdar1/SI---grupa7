export const runtime = 'edge';
import Link from 'next/link';

export default function Page() {
  return (
    <section className="page stack">
      <article className="panel stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">System control</span>
          <h1 className="section-title">Settings shell</h1>
          <p className="section-copy">
            This screen will host SLA configuration, language preferences, notification settings, and other admin
            controls from the backlog.
          </p>
        </div>

        <div className="tag-row">
          <span className="tag">PBI-031</span>
          <span className="tag">PBI-035</span>
          <span className="tag">Language</span>
          <span className="tag">SLA</span>
        </div>

        <div className="button-row">
          <Link className="button button--solid" href="/admin">
            Open admin area
          </Link>
          <Link className="button button--ghost" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </article>
    </section>
  );
}