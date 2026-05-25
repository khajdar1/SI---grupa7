'use client';
export const runtime = 'edge';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Paperclip,
  RefreshCw,
  Save,
  Shield,
  Tag,
  Timer,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { AccessDenied, PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/constants';
import { SUPPORTED_LANGUAGES, useI18n, type LanguageCode } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  getUserPreferences,
  NOTIFICATION_LABELS,
  OPTIONAL_NOTIFICATION_LABELS,
  updateUserPreferences,
  type UserPreferences,
} from '@/services/settings.service';

const ADMIN_QUICK_LINKS = [
  { label: 'SLA Config', href: ROUTES.ADMIN_SLA_CONFIG, icon: Timer },
  { label: 'Attachment Config', href: ROUTES.ADMIN_ATTACHMENT_CONFIG, icon: Paperclip },
  { label: 'Categories', href: ROUTES.ADMIN_CATEGORY, icon: Tag },
  { label: 'Users', href: ROUTES.ADMIN, icon: Users },
  { label: 'Companies', href: ROUTES.ADMIN_COMPANIES, icon: Shield },
] as const;

const settingsCopy = {
  en: {
    title: 'Settings',
    subtitle: 'Manage your personal preferences and application settings.',
    saveChanges: 'Save Changes',
    languageTitle: 'Language',
    languageDescription: 'Choose your preferred display language.',
    notificationsTitle: 'Notification Preferences',
    notificationsDescription: 'Choose which optional notifications you receive. Operational notifications are always enabled.',
    quickLinksTitle: 'Configuration Quick Links',
    quickLinksDescription: 'Access system configuration pages directly from here.',
    loading: 'Loading settings...',
    loadErrorTitle: 'Error',
    loadErrorDescription: 'Failed to load preferences.',
    saveSuccessTitle: 'Success',
    saveSuccessDescription: 'Preferences have been saved.',
    saveErrorTitle: 'Error',
    saveErrorDescription: 'Failed to save preferences.',
  },
  bs: {
    title: 'Postavke',
    subtitle: 'Upravljajte ličnim preferencama i postavkama aplikacije.',
    saveChanges: 'Spremi promjene',
    languageTitle: 'Jezik',
    languageDescription: 'Odaberite željeni jezik prikaza.',
    notificationsTitle: 'Postavke obavještenja',
    notificationsDescription: 'Odaberite koja opcionalna obavještenja želite primati. Operativna obavještenja su uvijek uključena.',
    quickLinksTitle: 'Prečice do konfiguracije',
    quickLinksDescription: 'Otvorite sistemske konfiguracije direktno sa ove stranice.',
    loading: 'Učitavanje postavki...',
    loadErrorTitle: 'Greška',
    loadErrorDescription: 'Učitavanje preferenci nije uspjelo.',
    saveSuccessTitle: 'Uspješno',
    saveSuccessDescription: 'Preference su spremljene.',
    saveErrorTitle: 'Greška',
    saveErrorDescription: 'Spremanje preferenci nije uspjelo.',
  },
} as const;

const notificationLabelsBs: Record<string, string> = {
  'New fault report': 'Nova prijava kvara',
  'Intervention assigned': 'Dodijeljena intervencija',
  'Status changed': 'Status promijenjen',
  'Feedback request': 'Zahtjev za povratnu informaciju',
  'Auto assignment': 'Automatska dodjela',
  'New support ticket': 'Novi tiket podrške',
  'Ticket reply': 'Odgovor na tiket',
};

const quickLinkLabelsBs: Record<string, string> = {
  'SLA Config': 'SLA konfiguracija',
  'Attachment Config': 'Konfiguracija priloga',
  Categories: 'Kategorije',
  Users: 'Korisnici',
  Companies: 'Kompanije',
};

function hasAdminRole(): boolean {
  if (typeof window === 'undefined') return false;
  const token = window.localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(
      window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as {
      realm_access?: { roles?: string[] };
      resource_access?: Record<string, { roles?: string[] }>;
    };
    const roles = [
      ...(payload.realm_access?.roles ?? []),
      ...Object.values(payload.resource_access ?? {}).flatMap((access) => access.roles ?? []),
    ].map((role) => role.toLowerCase());

    return roles.includes('admin') || roles.includes('administrator');
  } catch {
    return false;
  }
}

function normalizeLanguage(value: unknown): LanguageCode {
  return value === 'bs' ? 'bs' : 'en';
}

function translateLabel(language: LanguageCode, label: string) {
  if (language !== 'bs') {
    return label;
  }

  return notificationLabelsBs[label] ?? quickLinkLabelsBs[label] ?? label;
}

function NotificationToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-primary' : 'bg-input',
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { language, setLanguage, t } = useI18n();
  const copy = settingsCopy[language];
  const [authorized, setAuthorized] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(language);
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>({});

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const data: UserPreferences = await getUserPreferences();
      const nextLanguage = normalizeLanguage(data.language);

      setSelectedLanguage(nextLanguage);
      setLanguage(nextLanguage, { persistToProfile: false });
      setNotificationPrefs(data.notificationPreferences);
    } catch {
      const storedLanguage = typeof window !== 'undefined' && window.localStorage.getItem('language') === 'bs' ? 'bs' : 'en';
      toast.error(settingsCopy[storedLanguage].loadErrorTitle, {
        description: settingsCopy[storedLanguage].loadErrorDescription,
      });
    } finally {
      setIsLoading(false);
    }
  }, [setLanguage]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    setAuthorized(Boolean(token));
    setIsAdmin(hasAdminRole());
    setIsGuest(!token);

    if (!token) {
      setIsLoading(false);
      return;
    }

    void loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const handleToggleNotification = (key: string) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLanguageChange = (value: string | null) => {
    if (!value) {
      return;
    }

    const nextLanguage = normalizeLanguage(value);
    setSelectedLanguage(nextLanguage);
    setLanguage(nextLanguage);
  };

  const handleSave = async () => {
    if (isSaving || isLoading) {
      return;
    }

    try {
      setIsSaving(true);
      await updateUserPreferences({
        language: selectedLanguage,
        notificationPreferences: notificationPrefs,
      });
      setLanguage(selectedLanguage);
      toast.success(settingsCopy[selectedLanguage].saveSuccessTitle, {
        description: settingsCopy[selectedLanguage].saveSuccessDescription,
      });
    } catch {
      toast.error(settingsCopy[selectedLanguage].saveErrorTitle, {
        description: settingsCopy[selectedLanguage].saveErrorDescription,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!authorized) {
    return <AccessDenied reason={isGuest ? 'unauthenticated' : 'unauthorized'} />;
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        breadcrumbs={[{ label: t('nav.dashboard'), href: ROUTES.DASHBOARD }, { label: copy.title }]}
        primaryAction={{
          label: isSaving ? t('common.saving') : copy.saveChanges,
          onClick: handleSave,
          icon: <Save className="mr-2 h-4 w-4" />,
        }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{copy.languageTitle}</CardTitle>
            <CardDescription>{copy.languageDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 animate-pulse rounded-lg bg-muted" />
            ) : (
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.code === 'bs' ? t('language.bs') : t('language.en')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.notificationsTitle}</CardTitle>
            <CardDescription>{copy.notificationsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-5 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {Object.entries(isAdmin ? NOTIFICATION_LABELS : OPTIONAL_NOTIFICATION_LABELS).map(([key, label]) => (
                  <NotificationToggle
                    key={key}
                    label={translateLabel(language, label)}
                    checked={notificationPrefs[key] ?? true}
                    onChange={() => handleToggleNotification(key)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" />
              {copy.quickLinksTitle}
            </CardTitle>
            <CardDescription>{copy.quickLinksDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {ADMIN_QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Button
                    key={link.href}
                    asChild
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4"
                  >
                    <Link href={link.href}>
                      <Icon className="size-5" />
                      <span className="text-xs font-medium">{translateLabel(language, link.label)}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 p-12 text-sm text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          {copy.loading}
        </div>
      ) : null}
    </PageLayout>
  );
}
