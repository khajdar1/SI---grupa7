"use client";

import Link from 'next/link';

export default function Page() {
  return (
    <section className="auth-layout auth-layout--wide">
      <article className="auth-card panel">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Onboarding</span>
          <h1 className="section-title">Registration shell</h1>
          <p className="section-copy">
            The self-registration flow keeps the default role limited to a regular user, while administrators will get
            separate account management tools in the admin area.
          </p>
        </div>

        <form className="form-grid form-grid--two-columns" onSubmit={(event) => event.preventDefault()}>
          <label className="field">
            <span>First name</span>
            <input type="text" name="firstName" autoComplete="given-name" />
          </label>

          <label className="field">
            <span>Last name</span>
            <input type="text" name="lastName" autoComplete="family-name" />
          </label>

          <label className="field">
            <span>Username</span>
            <input type="text" name="username" autoComplete="username" />
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" />
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" name="password" autoComplete="new-password" />
          </label>

          <label className="field">
            <span>Confirm password</span>
            <input type="password" name="confirmPassword" autoComplete="new-password" />
          </label>

          <label className="field field--full">
            <span>Company / organization</span>
            <input type="text" name="company" placeholder="Selected during onboarding" />
          </label>

          <div className="form-actions field--full">
            <button className="button button--solid" type="submit">
              Create account
            </button>
            <Link className="button button--ghost" href="/login">
              Back to login
            </Link>
          </div>
        </form>
      </article>

      <aside className="panel panel--soft stack-tight">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Rules from the backlog</span>
          <h2 className="section-title">Registration is not a free-for-all.</h2>
        </div>

        <ul className="quick-facts">
          <li>Passwords and usernames will be validated before the account is created.</li>
          <li>Admin-managed roles and company bindings will stay outside self-registration.</li>
          <li>The backend will own the final decision on duplicates and role assignment.</li>
        </ul>
      </aside>
    </section>
  );
}