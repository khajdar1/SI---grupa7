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
import { cn } from '@/lib/utils';
import {
  getUserPreferences,
  NOTIFICATION_LABELS,
  OPTIONAL_NOTIFICATION_LABELS,
  SUPPORTED_LANGUAGES,
  updateUserPreferences,
  type UserPreferences,
} from '@/services/settings.service';
import { toast } from 'sonner';

const ADMIN_QUICK_LINKS = [
  { label: 'SLA Config', href: ROUTES.ADMIN_SLA_CONFIG, icon: Timer },
  { label: 'Attachment Config', href: ROUTES.ADMIN_ATTACHMENT_CONFIG, icon: Paperclip },
  { label: 'Categories', href: ROUTES.ADMIN_CATEGORY, icon: Tag },
  { label: 'Users', href: ROUTES.ADMIN, icon: Users },
  { label: 'Companies', href: ROUTES.ADMIN_COMPANIES, icon: Shield },
] as const;

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
      ...Object.values(payload.resource_access ?? {}).flatMap((a) => a.roles ?? []),
    ].map((r) => r.toLowerCase());
    return roles.includes('admin') || roles.includes('administrator');
  } catch {
    return false;
  }
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
    <div className="flex items-center justify-between py-2">
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
  const [authorized, setAuthorized] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [language, setLanguage] = useState('en');
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>({});

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const data: UserPreferences = await getUserPreferences();
      setLanguage(data.language);
      setNotificationPrefs(data.notificationPreferences);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load preferences.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    const canUseAdmin = hasAdminRole();
    setAuthorized(true);
    setIsAdmin(canUseAdmin);
    setIsGuest(!token);

    if (!token) {
      setAuthorized(false);
      setIsLoading(false);
      return;
    }

    void loadPreferences();
  }, [loadPreferences]);

  const handleToggleNotification = (key: string) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateUserPreferences({
        language,
        notificationPreferences: notificationPrefs,
      });
      toast.success('Success', {
        description: 'Preferences have been saved.',
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to save preferences.',
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
        title="Settings"
        subtitle="Manage your personal preferences and application settings."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Settings' }]}
        primaryAction={{
          label: 'Save Changes',
          onClick: handleSave,
          icon: <Save className="mr-2 h-4 w-4" />,
          isLoading: isSaving || isLoading,
        }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>
              Choose your preferred display language.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 animate-pulse rounded-lg bg-muted" />
            ) : (
              <Select value={language} onValueChange={(val) => { if (val) setLanguage(val); }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose which optional notifications you receive. Operational notifications are always enabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-5 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {Object.entries(isAdmin ? NOTIFICATION_LABELS : OPTIONAL_NOTIFICATION_LABELS).map(([key, label]) => (
                  <NotificationToggle
                    key={key}
                    label={label}
                    checked={notificationPrefs[key] ?? true}
                    onChange={() => handleToggleNotification(key)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" />
              Configuration Quick Links
            </CardTitle>
            <CardDescription>
              Access system configuration pages directly from here.
            </CardDescription>
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
                      <span className="text-xs font-medium">{link.label}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </PageLayout>
  );
}
