"use client";

import Link from 'next/link';

export default function Page() {
  return (
    <section className="auth-layout">
      <article className="auth-card panel">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Authentication</span>
          <h1 className="section-title">Login shell</h1>
          <p className="section-copy">
            The final implementation will validate credentials, route users by role, and keep protected screens out of
            reach without an active session.
          </p>
        </div>

        <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
          <label className="field">
            <span>Username</span>
            <input type="text" name="username" autoComplete="username" placeholder="jdoe" />
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" name="password" autoComplete="current-password" placeholder="********" />
          </label>

          <div className="form-actions">
            <button className="button button--solid" type="submit">
              Sign in
            </button>
            <Link className="button button--ghost" href="/reset-password">
              Reset password
            </Link>
            <Link className="button button--ghost" href="/register">
              Create account
            </Link>
          </div>
        </form>
      </article>

      <aside className="panel panel--soft stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Behavior from the docs</span>
          <h2 className="section-title">What this page will eventually cover</h2>
        </div>

        <ul className="quick-facts">
          <li>Generic error responses for invalid credentials.</li>
          <li>Blocked access for disabled accounts.</li>
          <li>Session termination on logout and role-based redirects.</li>
        </ul>
      </aside>
    </section>
  );
}