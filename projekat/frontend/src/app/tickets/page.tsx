export const runtime = 'edge';
import Link from 'next/link';

export default function Page() {
  return (
    <section className="page stack">
      <article className="panel stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Support operations</span>
          <h1 className="section-title">Tickets shell</h1>
          <p className="section-copy">
            This route covers support tickets, message threads, and the handoff between users and coordinators.
          </p>
        </div>

        <div className="tag-row">
          <span className="tag">Ticketing</span>
          <span className="tag">Messages</span>
          <span className="tag">PBI-027</span>
          <span className="tag">PBI-028</span>
        </div>

        <div className="button-row">
          <Link className="button button--solid" href="/fault-reports">
            Open fault intake
          </Link>
          <Link className="button button--ghost" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </article>
    </section>
  );
}