'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { CalendarX2, CheckCircle2, KeyRound, Save, UserCircle2 } from 'lucide-react';

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
import { translateText, useI18n } from '@/lib/i18n';
import { hasSessionRole } from '@/lib/auth';
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
  type UserProfile,
} from '@/services/profile.service';
import {
  cancelUnavailability,
  createUnavailability,
  getMyUnavailability,
  updateUnavailability,
  type UnavailabilityPeriod,
} from '@/services/availability.service';

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
const SERVICER_ROLES = new Set(['serviser']);

type AvailabilityForm = {
  id: number | null;
  startAt: string;
  endAt: string;
  reason: string;
};

const EMPTY_AVAILABILITY_FORM: AvailabilityForm = {
  id: null,
  startAt: '',
  endAt: '',
  reason: '',
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
  const { language, t } = useI18n();
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
  const [canManageAvailability, setCanManageAvailability] = useState(false);
  const [availability, setAvailability] = useState<UnavailabilityPeriod[]>([]);
  const [availabilityForm, setAvailabilityForm] = useState<AvailabilityForm>(EMPTY_AVAILABILITY_FORM);
  const [availabilityMessage, setAvailabilityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const currentProfile = await getMyProfile();
        if (!active) return;

        setProfile(currentProfile);
        const isServicer = hasSessionRole(SERVICER_ROLES);
        setCanManageAvailability(isServicer);
        setProfileForm({
          firstName: currentProfile.firstName,
          lastName: currentProfile.lastName,
          email: currentProfile.email,
        });
        if (isServicer) {
          setAvailability(await getMyUnavailability());
        }
      } catch (error) {
        if (!active) return;
        setProfileMessage({
          type: 'error',
          text: error instanceof Error ? translateText(language, error.message) : t('profile.loadError'),
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [language, t]);

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors = {
      firstName: validatePersonName(profileForm.firstName, {
        requiredMessage: t('validation.firstNameRequired'),
        maxLength: 100,
      }),
      lastName: validatePersonName(profileForm.lastName, {
        requiredMessage: t('validation.lastNameRequired'),
        maxLength: 100,
      }),
      email: validateEmail(profileForm.email, t('validation.emailRequired'), t('validation.emailInvalid')),
    };
    const filteredErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => value),
    );

    if (Object.keys(filteredErrors).length > 0) {
      setProfileErrors(filteredErrors);
      setProfileMessage({ type: 'error', text: t('profile.correctFields') });
      return;
    }

    setSavingProfile(true);
    setProfileErrors({});
    setProfileMessage(null);

    try {
      const updated = await updateMyProfile({
        ...profileForm,
        language,
      });
      setProfile(updated);
      updateStoredUser(updated);
      setProfileMessage({ type: 'success', text: t('profile.saved') });
    } catch (error) {
      const backendFieldErrors = readServiceFieldErrors(error);
      if (Object.keys(backendFieldErrors).length > 0) {
        setProfileErrors(backendFieldErrors);
      }
      setProfileMessage({
        type: 'error',
        text: error instanceof Error ? translateText(language, error.message) : t('profile.updateFailed'),
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!passwordForm.currentPassword.trim()) {
      nextErrors.currentPassword = t('validation.currentPasswordRequired');
    }
    if (passwordForm.newPassword.length < 8) {
      nextErrors.newPassword = t('validation.passwordMin');
    } else if (!/[0-9]/.test(passwordForm.newPassword) || !/[A-Z]/.test(passwordForm.newPassword)) {
      nextErrors.newPassword = t('validation.passwordComplexity');
    }
    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      nextErrors.confirmPassword = t('validation.passwordMismatch');
    }

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors);
      setPasswordMessage({ type: 'error', text: t('profile.correctFields') });
      return;
    }

    setSavingPassword(true);
    setPasswordErrors({});
    setPasswordMessage(null);

    try {
      await changeMyPassword(passwordForm);
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordMessage({ type: 'success', text: t('profile.passwordChanged') });
    } catch (error) {
      const backendFieldErrors = readServiceFieldErrors(error);
      if (Object.keys(backendFieldErrors).length > 0) {
        setPasswordErrors(backendFieldErrors);
      }
      setPasswordMessage({
        type: 'error',
        text: error instanceof Error ? translateText(language, error.message) : t('profile.passwordFailed'),
      });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleAvailabilitySubmit(event: React.FormEvent) {
    event.preventDefault();
    setAvailabilityMessage(null);

    if (!availabilityForm.startAt || !availabilityForm.endAt || !availabilityForm.reason.trim()) {
      setAvailabilityMessage({
        type: 'error',
        text: language === 'bs' ? 'Unesite pocetak, kraj i razlog odsustva.' : 'Enter start, end, and reason.',
      });
      return;
    }

    if (new Date(availabilityForm.endAt) <= new Date(availabilityForm.startAt)) {
      setAvailabilityMessage({
        type: 'error',
        text: language === 'bs' ? 'Kraj odsustva mora biti nakon pocetka.' : 'End must be after start.',
      });
      return;
    }

    setSavingAvailability(true);
    try {
      const payload = {
        startAt: new Date(availabilityForm.startAt).toISOString(),
        endAt: new Date(availabilityForm.endAt).toISOString(),
        reason: availabilityForm.reason.trim(),
      };
      const saved = availabilityForm.id
        ? await updateUnavailability(availabilityForm.id, payload)
        : await createUnavailability(payload);

      setAvailability((current) => {
        const exists = current.some((item) => item.id === saved.id);
        return exists
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current];
      });
      setAvailabilityForm(EMPTY_AVAILABILITY_FORM);
      setAvailabilityMessage({
        type: 'success',
        text: language === 'bs' ? 'Dostupnost je sacuvana.' : 'Availability saved.',
      });
    } catch (error) {
      setAvailabilityMessage({
        type: 'error',
        text: error instanceof Error ? translateText(language, error.message) : 'Failed to save availability.',
      });
    } finally {
      setSavingAvailability(false);
    }
  }

  async function handleCancelAvailability(id: number) {
    setAvailabilityMessage(null);
    try {
      const updated = await cancelUnavailability(id);
      setAvailability((current) => current.map((item) => (item.id === id ? updated : item)));
      setAvailabilityMessage({
        type: 'success',
        text: language === 'bs' ? 'Odsustvo je otkazano.' : 'Unavailability period canceled.',
      });
    } catch (error) {
      setAvailabilityMessage({
        type: 'error',
        text: error instanceof Error ? translateText(language, error.message) : 'Failed to cancel availability.',
      });
    }
  }

  function editAvailability(period: UnavailabilityPeriod) {
    setAvailabilityForm({
      id: period.id,
      startAt: toDatetimeLocal(period.startAt),
      endAt: toDatetimeLocal(period.endAt),
      reason: period.reason,
    });
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: ROUTES.DASHBOARD }, { label: t('profile.breadcrumbCurrent') }]}
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
                <CardTitle className="text-base">{t('profile.contactTitle')}</CardTitle>
                <CardDescription className="text-xs">{t('profile.contactDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {profileMessage ? <InlineMessage type={profileMessage.type} text={profileMessage.text} /> : null}

            <form className="space-y-4" onSubmit={handleProfileSubmit} noValidate>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t('profile.firstName')}</Label>
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
                      <Label htmlFor="lastName">{t('profile.lastName')}</Label>
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
                    <Label htmlFor="username">{t('profile.username')}</Label>
                    <Input id="username" value={profile?.username ?? ''} disabled className="bg-muted/50" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('profile.email')}</Label>
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
                        {t('common.saving')}
                      </span>
                    ) : (
                      <>
                        <Save className="size-4" />
                        {t('profile.saveChanges')}
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
                <CardTitle className="text-base">{t('profile.changePasswordTitle')}</CardTitle>
                <CardDescription className="text-xs">{t('profile.changePasswordDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {passwordMessage ? <InlineMessage type={passwordMessage.type} text={passwordMessage.text} /> : null}

            <form className="space-y-4" onSubmit={handlePasswordSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
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
                <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
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
                <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
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
                    {t('common.saving')}
                  </span>
                ) : (
                  <>
                    <KeyRound className="size-4" />
                    {t('profile.changePassword')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {canManageAvailability ? (
        <Card className="stat-card-glow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10">
                <CalendarX2 className="size-5 text-amber-700" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {language === 'bs' ? 'Dostupnost servisera' : 'Servicer Availability'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {language === 'bs' ? 'Unesite periode kada niste dostupni za nove intervencije.' : 'Enter periods when you are unavailable for new interventions.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {availabilityMessage ? <InlineMessage type={availabilityMessage.type} text={availabilityMessage.text} /> : null}
            <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr_auto]" onSubmit={handleAvailabilitySubmit}>
              <div className="space-y-2">
                <Label htmlFor="availability-start">{language === 'bs' ? 'Pocetak' : 'Start'}</Label>
                <Input
                  id="availability-start"
                  type="datetime-local"
                  value={availabilityForm.startAt}
                  onChange={(event) => setAvailabilityForm((previous) => ({ ...previous, startAt: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability-end">{language === 'bs' ? 'Kraj' : 'End'}</Label>
                <Input
                  id="availability-end"
                  type="datetime-local"
                  value={availabilityForm.endAt}
                  onChange={(event) => setAvailabilityForm((previous) => ({ ...previous, endAt: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability-reason">{language === 'bs' ? 'Razlog' : 'Reason'}</Label>
                <Input
                  id="availability-reason"
                  value={availabilityForm.reason}
                  onChange={(event) => setAvailabilityForm((previous) => ({ ...previous, reason: event.target.value }))}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={savingAvailability}>
                  {savingAvailability ? (language === 'bs' ? 'Spremanje...' : 'Saving...') : availabilityForm.id ? (language === 'bs' ? 'Azuriraj' : 'Update') : (language === 'bs' ? 'Dodaj' : 'Add')}
                </Button>
                {availabilityForm.id ? (
                  <Button type="button" variant="outline" onClick={() => setAvailabilityForm(EMPTY_AVAILABILITY_FORM)}>
                    {language === 'bs' ? 'Odustani' : 'Cancel'}
                  </Button>
                ) : null}
              </div>
            </form>

            <div className="space-y-2">
              {availability.length === 0 ? (
                <p className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                  {language === 'bs' ? 'Nema evidentiranih odsustava.' : 'No unavailability periods recorded.'}
                </p>
              ) : (
                availability.map((period) => (
                  <div key={period.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {formatDateTime(period.startAt, language)} - {formatDateTime(period.endAt, language)}
                      </p>
                      <p className="text-muted-foreground">{period.reason}</p>
                      {period.canceledAt ? (
                        <p className="text-xs text-destructive">{language === 'bs' ? 'Otkazano' : 'Canceled'}</p>
                      ) : null}
                    </div>
                    {!period.canceledAt && new Date(period.endAt) > new Date() ? (
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => editAvailability(period)}>
                          {language === 'bs' ? 'Uredi' : 'Edit'}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => void handleCancelAvailability(period.id)}>
                          {language === 'bs' ? 'Otkazi' : 'Cancel'}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageLayout>
  );
}

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatDateTime(value: string, language: 'en' | 'bs') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(language === 'bs' ? 'bs-BA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
