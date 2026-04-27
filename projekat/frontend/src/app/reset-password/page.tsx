"use client";

import Link from 'next/link';
import { useResetPassword } from './useResetPassword'; 

export default function ResetPasswordPage() {
  const { email, setEmail, submitting, message, handleSubmit } = useResetPassword();

  return (
    <section className="auth-layout">
      <article className="auth-card panel">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Authentication</span>
          <h1 className="section-title">Reset password</h1>
          <p className="section-copy">
            Enter your email and we'll send you a secure link to reset your password.
          </p>
        </div>

        {message && (
          <div style={{ color: message.type === 'error' ? 'red' : 'green', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {message.text}
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input 
              type="email" 
              name="email" 
              autoComplete="email" 
              placeholder="user@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <div className="form-actions">
            <button className="button button--solid" type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send reset link'}
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
          <h2 className="section-title">Account protection</h2>
        </div>

        <ul className="quick-facts">
          <li>Links expire shortly after generation.</li>
          <li>For security, we cannot confirm if an email exists in our system.</li>
          <li>You will be required to log in again after rotating your password.</li>
        </ul>
      </aside>
    </section>
  );
}