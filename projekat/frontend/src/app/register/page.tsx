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

        {serverError && <div style={{ color: 'red', marginBottom: '1rem' }}>{serverError}</div>}
        {success && <div style={{ color: 'green', marginBottom: '1rem' }}>Registration successful! Redirecting...</div>}

        <form className="form-grid form-grid--two-columns" onSubmit={handleSubmit}>
          <label className="field">
            <span>First name</span>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
            {errors.firstName && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.firstName}</span>}
          </label>

          <label className="field">
            <span>Last name</span>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
            {errors.lastName && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.lastName}</span>}
          </label>

          <label className="field">
            <span>Username</span>
            <input type="text" name="username" value={formData.username} onChange={handleChange} />
            {errors.username && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.username}</span>}
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
            {errors.email && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.email}</span>}
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" name="password" value={formData.password} onChange={handleChange} />
            {formData.password && (
              <span style={{ color: strength.color, fontSize: '0.8rem' }}>Password strength: {strength.label}</span>
            )}
            {errors.password && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.password}</span>}
          </label>

          <label className="field">
            <span>Confirm password</span>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
            {errors.confirmPassword && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.confirmPassword}</span>}
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