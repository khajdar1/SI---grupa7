'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Save, UserCircle2 } from 'lucide-react';

import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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

function InlineMessage({ type, text }: { type: 'success' | 'error'; text: string }) {
  return (
    <div className={`mb-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
      type === 'error'
        ? 'border-destructive/30 bg-destructive/5 text-destructive'
        : 'border-emerald-300/40 bg-emerald-50 text-emerald-700'
    }`}>
      {type === 'success' && <CheckCircle2 className="size-4 mt-0.5 shrink-0" />}
      {text}
    </div>
  );
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
      setProfileMessage({ type: 'success', text: 'Profile changes have been saved.' });
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
      nextErrors.confirmPassword = 'Passwords do not match.';
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
      setPasswordMessage({ type: 'success', text: 'Password has been changed successfully.' });
    } catch (error) {
      const backendFieldErrors = readServiceFieldErrors(error);
      if (Object.keys(backendFieldErrors).length > 0) {
        setPasswordErrors(backendFieldErrors);
      }
      setPasswordMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Password change failed.',
      });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="View and update your basic account information."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'My Profile' }]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        {/* Contact info card */}
        <Card className="stat-card-glow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <UserCircle2 className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Contact Information</CardTitle>
                <CardDescription className="text-xs">The username cannot be changed here.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {profileMessage ? <InlineMessage type={profileMessage.type} text={profileMessage.text} /> : null}

            <form className="space-y-4" onSubmit={handleProfileSubmit} noValidate>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(event) => {
                          setProfileForm((previous) => ({ ...previous, firstName: event.target.value }));
                          setProfileErrors((previous) => clearFieldError(previous, 'firstName'));
                        }}
                        aria-invalid={Boolean(profileErrors.firstName)}
                      />
                      {profileErrors.firstName ? <p className="text-xs text-destructive">{profileErrors.firstName}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(event) => {
                          setProfileForm((previous) => ({ ...previous, lastName: event.target.value }));
                          setProfileErrors((previous) => clearFieldError(previous, 'lastName'));
                        }}
                        aria-invalid={Boolean(profileErrors.lastName)}
                      />
                      {profileErrors.lastName ? <p className="text-xs text-destructive">{profileErrors.lastName}</p> : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={profile?.username ?? ''} disabled className="bg-muted/50" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => {
                        setProfileForm((previous) => ({ ...previous, email: event.target.value }));
                        setProfileErrors((previous) => clearFieldError(previous, 'email'));
                      }}
                      aria-invalid={Boolean(profileErrors.email)}
                    />
                    {profileErrors.email ? <p className="text-xs text-destructive">{profileErrors.email}</p> : null}
                  </div>

                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-glow gap-2 rounded-xl"
                  >
                    {savingProfile ? (
                      <span className="flex items-center gap-2">
                        <span className="spinner" />
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Save className="size-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Password card */}
        <Card className="stat-card-glow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10">
                <KeyRound className="size-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base">Change Password</CardTitle>
                <CardDescription className="text-xs">Enter your current password and confirm the new one.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {passwordMessage ? <InlineMessage type={passwordMessage.type} text={passwordMessage.text} /> : null}

            <form className="space-y-4" onSubmit={handlePasswordSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
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
                <Label htmlFor="newPassword">New Password</Label>
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
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
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

              <Button
                type="submit"
                disabled={savingPassword}
                className="btn-glow gap-2 rounded-xl"
              >
                {savingPassword ? (
                  <span className="flex items-center gap-2">
                    <span className="spinner" />
                    Saving...
                  </span>
                ) : (
                  <>
                    <KeyRound className="size-4" />
                    Change Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
