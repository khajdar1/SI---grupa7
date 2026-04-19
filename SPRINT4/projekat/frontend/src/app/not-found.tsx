import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="auth-layout">
      <article className="auth-card panel panel--soft stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">404</span>
          <h1 className="section-title">Page not found</h1>
          <p className="section-copy">
            The requested route does not exist yet. The navigation is intentionally wider than the current feature set
            so the skeleton can grow without rearranging the app shell.
          </p>
        </div>

        <Link className="button button--solid" href="/">
          Return home
        </Link>
      </article>
    </section>
  );
}