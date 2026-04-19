import Link from 'next/link';

export default function Page() {
  return (
    <section className="page stack">
      <article className="panel stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Account</span>
          <h1 className="section-title">Profile shell</h1>
          <p className="section-copy">
            This route will cover self-service profile edits, password updates, and user preferences.
          </p>
        </div>

        <div className="tag-row">
          <span className="tag">PBI-015</span>
          <span className="tag">Personal data</span>
          <span className="tag">Password change</span>
        </div>

        <div className="button-row">
          <Link className="button button--solid" href="/settings">
            Open settings
          </Link>
          <Link className="button button--ghost" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </article>
    </section>
  );
}