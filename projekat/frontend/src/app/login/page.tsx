"use client";

import Link from 'next/link';
import { useLogin } from './useLogin';

export default function LoginPage() {
  const { formData, errors, submitting, serverError, handleChange, handleSubmit } = useLogin();

  return (
    <section className="auth-layout">
      <article className="auth-card panel">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Authentication</span>
          <h1 className="section-title">Login shell</h1>
          <p className="section-copy">
            Enter your credentials to securely access the platform.
          </p>
        </div>

        {serverError && <div className="form-error">{serverError}</div>}

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Username <span className="field-required">*</span></span>
            <input 
              className={errors.username ? "field-input--error" : undefined}
              type="text" 
              name="username" 
              autoComplete="username" 
              placeholder="jdoe" 
              value={formData.username}
              onChange={handleChange}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "login-username-error" : undefined}
            />
            {errors.username && <span id="login-username-error" className="field-error">{errors.username}</span>}
          </label>

          <label className="field">
            <span className="field-label">Password <span className="field-required">*</span></span>
            <input 
              className={errors.password ? "field-input--error" : undefined}
              type="password" 
              name="password" 
              autoComplete="current-password" 
              placeholder="********" 
              value={formData.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
            />
            {errors.password && <span id="login-password-error" className="field-error">{errors.password}</span>}
          </label>

          <div className="form-actions">
            <button className="button button--solid" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
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
          <span className="section-kicker">Security</span>
          <h2 className="section-title">Protected Access</h2>
        </div>

        <ul className="quick-facts">
          <li>Sessions are securely managed via Keycloak.</li>
          <li>Role-based access limits functionality based on your account level.</li>
          <li>Ensure you log out when using public devices.</li>
        </ul>
      </aside>
    </section>
  );
}
