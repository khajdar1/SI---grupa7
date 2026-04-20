"use client";

import Link from 'next/link';

export default function Page() {
  return (
    <section className="auth-layout">
      <article className="auth-card panel">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Authentication</span>
          <h1 className="section-title">Reset password shell</h1>
          <p className="section-copy">
            The implementation will send a secure reset flow and let the user choose a new password after token
            validation.
          </p>
        </div>

        <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
          <label className="field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" placeholder="user@example.com" />
          </label>

          <div className="form-actions">
            <button className="button button--solid" type="submit">
              Send reset link
            </button>
            <Link className="button button--ghost" href="/login">
              Back to login
            </Link>
          </div>
        </form>
      </article>

      <aside className="panel panel--soft stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Security flow</span>
          <h2 className="section-title">What the final version will do</h2>
        </div>

        <ul className="quick-facts">
          <li>Rate limit reset requests.</li>
          <li>Accept only active token links.</li>
          <li>Force password rotation before re-entry.</li>
        </ul>
      </aside>
    </section>
  );
}