export const runtime = 'edge';
import Link from 'next/link';

export default function Page() {
  return (
    <section className="page stack">
      <article className="panel stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Geospatial view</span>
          <h1 className="section-title">Map shell</h1>
          <p className="section-copy">
            This screen will visualize fault and intervention locations, cluster work by area, and support dispatch.
          </p>
        </div>

        <div className="tag-row">
          <span className="tag">PBI-034</span>
          <span className="tag">Location clustering</span>
          <span className="tag">Dispatch support</span>
        </div>

        <div className="button-row">
          <Link className="button button--solid" href="/assignments">
            View assignments
          </Link>
          <Link className="button button--ghost" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </article>
    </section>
  );
}