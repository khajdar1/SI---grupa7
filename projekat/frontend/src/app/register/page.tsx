"use client";

import Link from 'next/link';
import { useRegister } from './useRegister';
import { getPasswordStrength } from './register.validation';

export default function RegisterPage() {
  const {
    formData,
    errors,
    submitting,
    serverError,
    success,
    handleChange,
    handleSubmit,
  } = useRegister();

  const strength = getPasswordStrength(formData.password);

  return (
    <section className="auth-layout auth-layout--wide">
      <article className="auth-card panel">
        <div className="section-heading section-heading--compact">
          <span className="section-kicker">Onboarding</span>
          <h1 className="section-title">Create Account</h1>
          <p className="section-copy">
            Register to access the platform.
          </p>
        </div>

        {serverError && <div className="form-error">{serverError}</div>}
        {success && <div className="form-success">Registration successful! Redirecting...</div>}

        <form className="form-grid form-grid--two-columns" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">First name <span className="field-required">*</span></span>
            <input
              className={errors.firstName ? "field-input--error" : undefined}
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? "register-firstName-error" : undefined}
            />
            {errors.firstName && <span id="register-firstName-error" className="field-error">{errors.firstName}</span>}
          </label>

          <label className="field">
            <span className="field-label">Last name <span className="field-required">*</span></span>
            <input
              className={errors.lastName ? "field-input--error" : undefined}
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? "register-lastName-error" : undefined}
            />
            {errors.lastName && <span id="register-lastName-error" className="field-error">{errors.lastName}</span>}
          </label>

          <label className="field">
            <span className="field-label">Username <span className="field-required">*</span></span>
            <input
              className={errors.username ? "field-input--error" : undefined}
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "register-username-error" : undefined}
            />
            {errors.username && <span id="register-username-error" className="field-error">{errors.username}</span>}
          </label>

          <label className="field">
            <span className="field-label">Email <span className="field-required">*</span></span>
            <input
              className={errors.email ? "field-input--error" : undefined}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "register-email-error" : undefined}
            />
            {errors.email && <span id="register-email-error" className="field-error">{errors.email}</span>}
          </label>

          <label className="field">
            <span className="field-label">Password <span className="field-required">*</span></span>
            <input
              className={errors.password ? "field-input--error" : undefined}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "register-password-error" : "register-password-help"}
            />
            {formData.password && (
              <span id="register-password-help" className="field-help" style={{ color: strength.color }}>
                Password strength: {strength.label}
              </span>
            )}
            {errors.password && <span id="register-password-error" className="field-error">{errors.password}</span>}
          </label>

          <label className="field">
            <span className="field-label">Confirm password <span className="field-required">*</span></span>
            <input
              className={errors.confirmPassword ? "field-input--error" : undefined}
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? "register-confirmPassword-error" : undefined}
            />
            {errors.confirmPassword && <span id="register-confirmPassword-error" className="field-error">{errors.confirmPassword}</span>}
          </label>

          <div className="form-actions field--full">
            <button className="button button--solid" type="submit" disabled={submitting || success}>
              {submitting ? 'Creating...' : 'Create account'}
            </button>
            <Link className="button button--ghost" href="/login">
              Back to login
            </Link>
          </div>
        </form>
      </article>
    </section>
  );
}
