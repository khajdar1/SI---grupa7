'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { KeyRound, Save } from 'lucide-react';

import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants';
import {
  clearFieldError,
  getApiFieldErrors,
  validateEmail,
  validatePersonName,
} from '@/lib/form-validation';
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
  type UserProfile,
} from '@/services/profile.service';

type ProfileForm = Pick<UserProfile, 'firstName' | 'lastName' | 'email'>;
type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const EMPTY_PASSWORD_FORM: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function readServiceFieldErrors(error: unknown) {
  const details =
    typeof error === 'object' && error !== null
      ? (error as { details?: unknown }).details
      : undefined;

  return getApiFieldErrors(
    details ? { response: (details as { response?: unknown }).response } : error,
  );
}

function updateStoredUser(profile: UserProfile) {
  const rawUser = window.localStorage.getItem('user');
  const existing = rawUser ? JSON.parse(rawUser) : {};
  window.localStorage.setItem('user', JSON.stringify({ ...existing, ...profile }));
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const currentProfile = await getMyProfile();
        if (!active) return;

        setProfile(currentProfile);
        setProfileForm({
          firstName: currentProfile.firstName,
          lastName: currentProfile.lastName,
          email: currentProfile.email,
        });
      } catch (error) {
        if (!active) return;
        setProfileMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Failed to load profile.',
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors = {
      firstName: validatePersonName(profileForm.firstName, {
        requiredMessage: 'First name is required.',
        maxLength: 100,
      }),
      lastName: validatePersonName(profileForm.lastName, {
        requiredMessage: 'Last name is required.',
        maxLength: 100,
      }),
      email: validateEmail(profileForm.email, 'Email is required.', 'Enter a valid email address.'),
    };
    const filteredErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => value),
    );

    if (Object.keys(filteredErrors).length > 0) {
      setProfileErrors(filteredErrors);
      setProfileMessage({ type: 'error', text: 'Please correct the highlighted fields.' });
      return;
    }

    setSavingProfile(true);
    setProfileErrors({});
    setProfileMessage(null);

    try {
      const updated = await updateMyProfile(profileForm);
      setProfile(updated);
      updateStoredUser(updated);
      setProfileMessage({ type: 'success', text: 'Profile changes saved.' });
    } catch (error) {
      const backendFieldErrors = readServiceFieldErrors(error);
      if (Object.keys(backendFieldErrors).length > 0) {
        setProfileErrors(backendFieldErrors);
      }
      setProfileMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Profile update failed.',
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!passwordForm.currentPassword.trim()) {
      nextErrors.currentPassword = 'Current password is required.';
    }
    if (passwordForm.newPassword.length < 8) {
      nextErrors.newPassword = 'Password must be at least 8 characters.';
    } else if (!/[0-9]/.test(passwordForm.newPassword) || !/[A-Z]/.test(passwordForm.newPassword)) {
      nextErrors.newPassword = 'Password must contain one uppercase letter and one number.';
    }
    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      nextErrors.confirmPassword = 'Password confirmation does not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors);
      setPasswordMessage({ type: 'error', text: 'Please correct the highlighted fields.' });
      return;
    }

    setSavingPassword(true);
    setPasswordErrors({});
    setPasswordMessage(null);

    try {
      await changeMyPassword(passwordForm);
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
    } catch (error) {
      const backendFieldErrors = readServiceFieldErrors(error);
      if (Object.keys(backendFieldErrors).length > 0) {
        setPasswordErrors(backendFieldErrors);
      }
      setPasswordMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Password update failed.',
      });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Moj profil"
        subtitle="Pregled i ažuriranje osnovnih podataka računa."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Moj profil' }]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card>
          <CardHeader>
            <CardTitle>Kontaktni podaci</CardTitle>
            <CardDescription>Korisničko ime je informativno i ne može se mijenjati ovdje.</CardDescription>
          </CardHeader>
          <CardContent>
            {profileMessage ? (
              <p className={profileMessage.type === 'error' ? 'mb-4 text-sm text-destructive' : 'mb-4 text-sm text-emerald-600'}>
                {profileMessage.text}
              </p>
            ) : null}

            <form className="space-y-4" onSubmit={handleProfileSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ime</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(event) => {
                      setProfileForm((previous) => ({ ...previous, firstName: event.target.value }));
                      setProfileErrors((previous) => clearFieldError(previous, 'firstName'));
                    }}
                    disabled={loading}
                    aria-invalid={Boolean(profileErrors.firstName)}
                  />
                  {profileErrors.firstName ? <p className="text-xs text-destructive">{profileErrors.firstName}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Prezime</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(event) => {
                      setProfileForm((previous) => ({ ...previous, lastName: event.target.value }));
                      setProfileErrors((previous) => clearFieldError(previous, 'lastName'));
                    }}
                    disabled={loading}
                    aria-invalid={Boolean(profileErrors.lastName)}
                  />
                  {profileErrors.lastName ? <p className="text-xs text-destructive">{profileErrors.lastName}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Korisničko ime</Label>
                <Input id="username" value={profile?.username ?? ''} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email adresa</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => {
                    setProfileForm((previous) => ({ ...previous, email: event.target.value }));
                    setProfileErrors((previous) => clearFieldError(previous, 'email'));
                  }}
                  disabled={loading}
                  aria-invalid={Boolean(profileErrors.email)}
                />
                {profileErrors.email ? <p className="text-xs text-destructive">{profileErrors.email}</p> : null}
              </div>

              <Button type="submit" disabled={loading || savingProfile} className="gap-2">
                <Save className="size-4" />
                {savingProfile ? 'Spremanje...' : 'Sačuvaj promjene'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promjena lozinke</CardTitle>
            <CardDescription>Unesite trenutnu lozinku i novu lozinku s potvrdom.</CardDescription>
          </CardHeader>
          <CardContent>
            {passwordMessage ? (
              <p className={passwordMessage.type === 'error' ? 'mb-4 text-sm text-destructive' : 'mb-4 text-sm text-emerald-600'}>
                {passwordMessage.text}
              </p>
            ) : null}

            <form className="space-y-4" onSubmit={handlePasswordSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Trenutna lozinka</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => {
                    setPasswordForm((previous) => ({ ...previous, currentPassword: event.target.value }));
                    setPasswordErrors((previous) => clearFieldError(previous, 'currentPassword'));
                  }}
                  aria-invalid={Boolean(passwordErrors.currentPassword)}
                />
                {passwordErrors.currentPassword ? <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova lozinka</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(event) => {
                    setPasswordForm((previous) => ({ ...previous, newPassword: event.target.value }));
                    setPasswordErrors((previous) => clearFieldError(previous, 'newPassword'));
                  }}
                  aria-invalid={Boolean(passwordErrors.newPassword)}
                />
                {passwordErrors.newPassword ? <p className="text-xs text-destructive">{passwordErrors.newPassword}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Potvrda nove lozinke</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => {
                    setPasswordForm((previous) => ({ ...previous, confirmPassword: event.target.value }));
                    setPasswordErrors((previous) => clearFieldError(previous, 'confirmPassword'));
                  }}
                  aria-invalid={Boolean(passwordErrors.confirmPassword)}
                />
                {passwordErrors.confirmPassword ? <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p> : null}
              </div>

              <Button type="submit" disabled={savingPassword} className="gap-2">
                <KeyRound className="size-4" />
                {savingPassword ? 'Spremanje...' : 'Promijeni lozinku'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
