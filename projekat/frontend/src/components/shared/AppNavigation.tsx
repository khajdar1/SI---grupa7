'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BarChart2,
  Bell,
  ChevronDown,
  ClipboardList,
  Clock,
  Home,
  KeyRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map,
  Menu,
  Paperclip,
  Plus,
  Settings,
  Shield,
  Tag,
  Ticket,
  Timer,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/constants';
import { useI18n, type LanguageCode } from '@/lib/i18n';
import { socket } from '@/lib/socket';
import { getNotifications, markNotificationAsRead, type NotificationItem } from '@/services/notifications.service';
import {
  ACCOUNT_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  AUTH_NAV_ITEMS,
  MANAGEMENT_NAV_ITEMS,
  OPERATIONS_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
  type NavItem,
} from '@/constants/content';
import { cn } from '@/lib/utils';

type AuthState = 'unknown' | 'authenticated' | 'guest';
type SessionUser = { id?: number; username?: string };

const ADMIN_ROLE_NAMES = new Set(['admin', 'administrator']);
const SUPPORT_AGENT_ROLE_NAMES = new Set(['supportagent', 'agentpodrske']);
const COMPANY_ADMIN_ROLE_NAMES = new Set(['kompanijaadmin', 'companyadmin']);
const HISTORY_ROLE_NAMES = new Set([
  'serviser',
  'koordinator',
  'coordinator',
  'management',
  'menadzment',
  'admin',
  'administrator',
]);
const REPORT_ROLE_NAMES = new Set([
  'serviser',
  'koordinator',
  'coordinator',
  'management',
  'menadzment',
  'admin',
  'administrator',
]);
const MANAGEMENT_ROLE_NAMES = new Set(['menadzment', 'management', 'admin', 'administrator']);
const ASSIGNMENT_MANAGEMENT_ROLE_NAMES = new Set([
  'koordinator',
  'coordinator',
  'management',
  'menadzment',
  'admin',
  'administrator',
]);
const INTERVENTION_ACCESS_ROLE_NAMES = new Set([
  'korisnik',
  'serviser',
  'koordinator',
  'coordinator',
  'management',
  'menadzment',
  'admin',
  'administrator',
  'supportagent',
  'agentpodrske',
]);
const INTERVENTION_CREATE_ROLE_NAMES = new Set([
  'koordinator',
  'coordinator',
  'admin',
  'administrator',
]);
const BLOCKING_ROLE_NAMES = new Set(['koordinator', 'coordinator', 'admin', 'administrator']);

const NAV_ICONS: Record<string, ReactNode> = {
  [ROUTES.HOME]: <Home className="size-4" />,
  [ROUTES.DASHBOARD]: <LayoutDashboard className="size-4" />,
  [ROUTES.FAULT_REPORTS]: <AlertTriangle className="size-4" />,
  [ROUTES.INTERVENTIONS]: <Wrench className="size-4" />,
  [ROUTES.ASSIGNMENTS]: <UserCheck className="size-4" />,
  [ROUTES.REPORTS]: <BarChart2 className="size-4" />,
  [ROUTES.INTERVENTION_NEW]: <Plus className="size-4" />,
  [ROUTES.HISTORY]: <Clock className="size-4" />,
  [ROUTES.TICKETS]: <Ticket className="size-4" />,
  [ROUTES.TICKET_CREATE]: <Ticket className="size-4" />,
  [ROUTES.MAP]: <Map className="size-4" />,
  [ROUTES.ADMIN]: <Users className="size-4" />,
  [ROUTES.ADMIN_COMPANIES]: <Shield className="size-4" />,
  [ROUTES.ADMIN_CATEGORY]: <Tag className="size-4" />,
  [ROUTES.ADMIN_SLA_CONFIG]: <Timer className="size-4" />,
  [ROUTES.ADMIN_ATTACHMENT_CONFIG]: <Paperclip className="size-4" />,
  [ROUTES.BLOCKED_USERS]: <Shield className="size-4" />,
  [ROUTES.MANAGEMENT_DASHBOARD]: <BarChart2 className="size-4" />,
  [ROUTES.PROFILE]: <User className="size-4" />,
  [ROUTES.COMPANY]: <Shield className="size-4" />,
  [ROUTES.SETTINGS]: <Settings className="size-4" />,
  [ROUTES.LOGOUT]: <LogOut className="size-4" />,
  [ROUTES.LOGIN]: <LogIn className="size-4" />,
  [ROUTES.REGISTER]: <UserPlus className="size-4" />,
  [ROUTES.COMPANY_REGISTER]: <Shield className="size-4" />,
  [ROUTES.RESET_PASSWORD]: <KeyRound className="size-4" />,
};

function getRoutePath(href: string): string {
  return href.split(/[?#]/)[0] || ROUTES.HOME;
}

function isRouteActive(pathname: string, href: string): boolean {
  const routePath = getRoutePath(href);

  if (routePath === ROUTES.HOME) {
    return pathname === ROUTES.HOME;
  }

  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

function isAdminReviewNotification(notification: NotificationItem): boolean {
  return (
    notification.ticketId !== null &&
    (notification.title === 'Admin review requested' || notification.title === 'Support trazi admin pregled')
  );
}

function translateNotificationTitle(notification: NotificationItem, language: LanguageCode): string {
  if (language !== 'bs') {
    return notification.title;
  }

  const titleTranslations: Record<string, string> = {
    'New fault report': 'Nova prijava kvara',
    'You have been assigned a new intervention': 'Dodijeljena vam je nova intervencija',
    'New support ticket': 'Novi tiket podrške',
    'Ticket closed': 'Tiket zatvoren',
    'Ticket reply': 'Odgovor na tiket',
    'New ticket reply': 'Novi odgovor na tiket',
    'Admin review requested': 'Zatražen admin pregled',
    'Support trazi admin pregled': 'Podrška traži admin pregled',
    'User blocked': 'Korisnik blokiran',
    'User unblocked': 'Korisnik odblokiran',
    'Appointment scheduled': 'Termin zakazan',
    'Appointment change requested': 'Zahtjev za promjenu termina',
    'Appointment change approved': 'Promjena termina odobrena',
    'Appointment change rejected': 'Promjena termina odbijena',
    'Alternative appointment proposed': 'Predložen alternativni termin',
  };

  return titleTranslations[notification.title] ?? notification.title;
}

function translatePriority(value: string): string {
  const priorityTranslations: Record<string, string> = {
    LOW: 'Nizak',
    MEDIUM: 'Srednji',
    HIGH: 'Visok',
    CRITICAL: 'Kritičan',
    low: 'nizak',
    medium: 'srednji',
    high: 'visok',
    critical: 'kritičan',
  };

  return priorityTranslations[value] ?? value;
}

function translateNotificationText(notification: NotificationItem, language: LanguageCode): string {
  if (language !== 'bs') {
    return notification.text;
  }

  const unknownLocation = 'Nepoznata lokacija';
  let text = notification.text
    .replace(/\bUnknown location\b/g, unknownLocation)
    .replace(/\blocation:/gi, 'lokacija:')
    .replace(/\bLocation:/g, 'Lokacija:')
    .replace(/\bPriority:/g, 'Prioritet:')
    .replace(/\bIntervention:/g, 'Intervencija:')
    .replace(/\bReason:/g, 'Razlog:');

  const ticketClosedMatch = text.match(/^Ticket #(\d+): (.+) has been closed\.$/);
  if (ticketClosedMatch) {
    return `Tiket #${ticketClosedMatch[1]}: ${ticketClosedMatch[2]} je zatvoren.`;
  }

  const agentReplyMatch = text.match(/^An agent replied to ticket #(\d+): (.+)$/);
  if (agentReplyMatch) {
    return `Agent je odgovorio na tiket #${agentReplyMatch[1]}: ${agentReplyMatch[2]}`;
  }

  const userReplyMatch = text.match(/^The user replied to ticket #(\d+): (.+)$/);
  if (userReplyMatch) {
    return `Korisnik je odgovorio na tiket #${userReplyMatch[1]}: ${userReplyMatch[2]}`;
  }

  const userBlockedWithReasonMatch = text.match(/^User (.+) \((.+)\) was blocked from ticket #(\d+): (.+)\. Reason: (.+)$/);
  if (userBlockedWithReasonMatch) {
    return `Korisnik ${userBlockedWithReasonMatch[1]} (${userBlockedWithReasonMatch[2]}) je blokiran na tiketu #${userBlockedWithReasonMatch[3]}: ${userBlockedWithReasonMatch[4]}. Razlog: ${userBlockedWithReasonMatch[5]}`;
  }

  const userBlockedMatch = text.match(/^User (.+) was blocked from ticket #(\d+)\.$/);
  if (userBlockedMatch) {
    return `Korisnik ${userBlockedMatch[1]} je blokiran na tiketu #${userBlockedMatch[2]}.`;
  }

  const userUnblockedWithTicketMatch = text.match(/^User (.+) \((.+)\) was unblocked from ticket #(\d+): (.+)\.$/);
  if (userUnblockedWithTicketMatch) {
    return `Korisnik ${userUnblockedWithTicketMatch[1]} (${userUnblockedWithTicketMatch[2]}) je odblokiran na tiketu #${userUnblockedWithTicketMatch[3]}: ${userUnblockedWithTicketMatch[4]}.`;
  }

  const userUnblockedMatch = text.match(/^User (.+) was unblocked from ticket #(\d+)\.$/);
  if (userUnblockedMatch) {
    return `Korisnik ${userUnblockedMatch[1]} je odblokiran na tiketu #${userUnblockedMatch[2]}.`;
  }

  text = text.replace(/\bPriority: ([^,]+)/g, (_, priority: string) => `Prioritet: ${translatePriority(priority)}`);

  return text;
}

function getNotificationPin(text: string): string | null {
  return text.match(/\b(?:One-time PIN|Jednokratni PIN):\s*(\d{6})\b/i)?.[1] ?? null;
}

function decodeJwtPayload(token: string): {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
} | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    return JSON.parse(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function getTokenRoles(token: string | null): string[] {
  if (!token) {
    return [];
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return [];
  }

  const realmRoles = payload.realm_access?.roles ?? [];
  const clientRoles = Object.values(payload.resource_access ?? {}).flatMap((clientAccess) => clientAccess.roles ?? []);

  return [...realmRoles, ...clientRoles].map((role) => role.toLowerCase());
}

function hasRole(token: string | null, allowedRoles: Set<string>): boolean {
  return getTokenRoles(token).some((role) => allowedRoles.has(role));
}

function hasAnyRole(roles: readonly string[], allowedRoles: Set<string>): boolean {
  return roles.some((role) => allowedRoles.has(role));
}

function canViewPrimaryRoute(route: string, roles: readonly string[]): boolean {
  if (route === ROUTES.HOME || route === ROUTES.DASHBOARD) {
    return true;
  }

  if (route === ROUTES.FAULT_REPORTS) {
    return true;
  }

  if (route === ROUTES.INTERVENTIONS) {
    return hasAnyRole(roles, INTERVENTION_ACCESS_ROLE_NAMES);
  }

  if (route === ROUTES.ASSIGNMENTS) {
    return hasAnyRole(roles, ASSIGNMENT_MANAGEMENT_ROLE_NAMES);
  }

  if (route === ROUTES.REPORTS) {
    return hasAnyRole(roles, REPORT_ROLE_NAMES);
  }

  return true;
}

function canViewOperationsRoute(route: string, roles: readonly string[]): boolean {
  if (route === ROUTES.INTERVENTION_NEW) {
    return hasAnyRole(roles, INTERVENTION_CREATE_ROLE_NAMES);
  }

  if (route === ROUTES.HISTORY) {
    return hasAnyRole(roles, HISTORY_ROLE_NAMES);
  }

  if (route === ROUTES.MAP) {
    return hasAnyRole(roles, ASSIGNMENT_MANAGEMENT_ROLE_NAMES);
  }

  if (route === ROUTES.TICKETS) {
    return true;
  }

  if (route === ROUTES.BLOCKED_USERS) {
    return hasAnyRole(roles, BLOCKING_ROLE_NAMES);
  }

  return true;
}

function NavLink({ item, pathname, showIcon = true }: { item: NavItem; pathname: string; showIcon?: boolean }) {
  const isActive = isRouteActive(pathname, item.to);
  const icon = NAV_ICONS[item.to];
  const { translateNavLabel } = useI18n();

  return (
    <Link
      href={item.to}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive ? 'nav-active-pill' : 'text-muted-foreground hover:bg-slate-100/80 hover:text-foreground',
      )}
    >
      {showIcon && icon ? <span className="shrink-0">{icon}</span> : null}
      {translateNavLabel(item.label)}
    </Link>
  );
}

function NavDropdown({
  label,
  icon,
  items,
  pathname,
}: {
  label: string;
  icon: ReactNode;
  items: readonly NavItem[];
  pathname: string;
}) {
  const hasActiveItem = items.some((item) => isRouteActive(pathname, item.to));
  const { translateNavLabel } = useI18n();
  const translatedLabel = translateNavLabel(label);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'h-9 gap-1.5 rounded-lg px-3 text-sm transition-all duration-200',
            hasActiveItem ? 'nav-active-pill' : 'text-muted-foreground hover:bg-slate-100/80 hover:text-foreground',
          )}
        >
          <span className="shrink-0">{icon}</span>
          {translatedLabel}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{translatedLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => {
          const isActive = isRouteActive(pathname, item.to);
          const itemIcon = NAV_ICONS[item.to];

          return (
            <DropdownMenuItem asChild key={item.to}>
              <Link href={item.to} className={cn('flex items-center gap-2', isActive && 'font-medium text-primary')}>
                {itemIcon ? <span className="shrink-0 text-muted-foreground">{itemIcon}</span> : null}
                {translateNavLabel(item.label)}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t, translateNavLabel } = useI18n();
  const [authState, setAuthState] = useState<AuthState>('unknown');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isManagement, setIsManagement] = useState(false);
  const [sessionRoles, setSessionRoles] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [reviewNotification, setReviewNotification] = useState<NotificationItem | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const readAuthState = () => {
      try {
        const token = window.localStorage.getItem('token');
        const rawUser = window.localStorage.getItem('user');
        const parsedUser = rawUser ? (JSON.parse(rawUser) as SessionUser) : null;
        const roles = getTokenRoles(token);

        setSessionUser(parsedUser);
        setIsAdmin(hasRole(token, ADMIN_ROLE_NAMES));
        setIsCompanyAdmin(hasRole(token, COMPANY_ADMIN_ROLE_NAMES));
        setIsManagement(hasRole(token, MANAGEMENT_ROLE_NAMES));
        setSessionRoles(roles);
        setAuthState(token ? 'authenticated' : 'guest');
      } catch {
        setSessionUser(null);
        setIsAdmin(false);
        setIsCompanyAdmin(false);
        setIsManagement(false);
        setSessionRoles([]);
        setAuthState('guest');
      }
    };

    readAuthState();
    window.addEventListener('storage', readAuthState);
    window.addEventListener('focus', readAuthState);

    return () => {
      window.removeEventListener('storage', readAuthState);
      window.removeEventListener('focus', readAuthState);
    };
  }, [pathname]);

  useEffect(() => {
    if (authState !== 'authenticated' || !sessionUser?.id) {
      return;
    }

    void getNotifications().then(setNotifications).catch(() => {});

    socket.connect();
    socket.emit('user:join', sessionUser.id);

    const roles = getTokenRoles(window.localStorage.getItem('token'));
    if (roles.some((r) => r === 'koordinator' || r === 'coordinator' || r === 'admin' || r === 'administrator')) {
      socket.emit('role:join', 'koordinator');
    }
    if (roles.some((r) => SUPPORT_AGENT_ROLE_NAMES.has(r))) {
      socket.emit('role:join', 'supportagent');
    }
    if (roles.some((r) => ADMIN_ROLE_NAMES.has(r))) {
      socket.emit('role:join', 'admin');
    }

    const handleNew = (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    socket.on('notification:new', handleNew);

    return () => {
      socket.off('notification:new', handleNew);
      socket.disconnect();
    };
  }, [authState, sessionUser?.id]);

  async function handleMarkRead(notificationId: number) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );

    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
    } catch {
      // silently fail — badge will be corrected on next load
    }
  }

  function handleNotificationClick(notification: NotificationItem) {
    void handleMarkRead(notification.id);

    if (isAdminReviewNotification(notification)) {
      setReviewNotification({ ...notification, read: true });
      setNotifOpen(false);
      return;
    }

    setNotifOpen(false);
    if (notification.interventionId) {
      router.push(`/interventions/${notification.interventionId}`);
    } else if (notification.ticketId) {
      router.push(`${ROUTES.TICKETS}/${notification.ticketId}`);
    }
  }

  async function handleReviewJoin() {
    if (!reviewNotification) {
      return;
    }

    await handleMarkRead(reviewNotification.id);
    setReviewNotification(null);
    if (reviewNotification.ticketId) {
      router.push(`${ROUTES.TICKETS}/${reviewNotification.ticketId}`);
    }
  }

  async function handleReviewReject() {
    if (!reviewNotification) {
      return;
    }

    await handleMarkRead(reviewNotification.id);
    setReviewNotification(null);
  }

  const isAuthenticated = authState === 'authenticated';

  const visiblePrimaryItems = useMemo(() => {
    if (!isAuthenticated) {
      return PRIMARY_NAV_ITEMS.filter((item) => item.to === ROUTES.HOME);
    }

    if (isCompanyAdmin && !isAdmin) {
      return PRIMARY_NAV_ITEMS.filter((item) => item.to === ROUTES.HOME || item.to === ROUTES.DASHBOARD);
    }

    return PRIMARY_NAV_ITEMS.filter((item) => canViewPrimaryRoute(item.to, sessionRoles));
  }, [isAdmin, isAuthenticated, isCompanyAdmin, sessionRoles]);

  const visibleAccountItems = useMemo(
    () => ACCOUNT_NAV_ITEMS.filter((item) => (item.to === ROUTES.COMPANY ? isCompanyAdmin : true)),
    [isCompanyAdmin],
  );

  const primaryItems = useMemo(
    () => visiblePrimaryItems.filter((item) => item.to === ROUTES.HOME || item.to === ROUTES.DASHBOARD),
    [visiblePrimaryItems],
  );

  const workItems = useMemo(
    () => visiblePrimaryItems.filter((item) => item.to !== ROUTES.HOME && item.to !== ROUTES.DASHBOARD),
    [visiblePrimaryItems],
  );

  const operationsItems = useMemo(() => {
    if (isCompanyAdmin && !isAdmin) {
      return [];
    }

    const items = OPERATIONS_NAV_ITEMS
      .filter((item) => item.to !== ROUTES.TICKETS)
      .filter((item) => canViewOperationsRoute(item.to, sessionRoles));

    return isManagement ? [...items, ...MANAGEMENT_NAV_ITEMS] : items;
  }, [isAdmin, isCompanyAdmin, isManagement, sessionRoles]);

  const initials = sessionUser?.username ? sessionUser.username.slice(0, 2).toUpperCase() : '?';
  const ticketNavItem: NavItem = { label: 'Tickets', to: ROUTES.TICKETS };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 shadow-[0_1px_28px_rgba(15,23,42,0.07)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[var(--content-max-width)] items-center gap-4 px-4 py-2.5 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
          <Link href={ROUTES.HOME} className="flex shrink-0 items-center gap-2">
            <div className="logo-mark flex size-8 items-center justify-center rounded-xl text-white">
              <Wrench className="size-4" />
            </div>
            <span className="gradient-text hidden text-sm font-black tracking-tight sm:block">ServisIS</span>
          </Link>

          <div className="hidden h-5 w-px bg-border lg:block" />

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
            {primaryItems.map((item) => (
              <NavLink key={item.to} item={item} pathname={pathname} />
            ))}
            {isAuthenticated ? (
              <>
                <NavLink item={ticketNavItem} pathname={pathname} />
                {workItems.length > 0 ? (
                  <NavDropdown
                    label={t('nav.work')}
                    icon={<Wrench className="size-4" />}
                    items={workItems}
                    pathname={pathname}
                  />
                ) : null}
                {operationsItems.length > 0 ? (
                  <NavDropdown
                    label={t('nav.operations')}
                    icon={<ClipboardList className="size-4" />}
                    items={operationsItems}
                    pathname={pathname}
                  />
                ) : null}
              </>
            ) : null}
          </nav>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {isAdmin ? (
            <NavDropdown label={t('nav.admin')} icon={<Shield className="size-4" />} items={ADMIN_NAV_ITEMS} pathname={pathname} />
          ) : null}
          {isAuthenticated ? (
            <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-9 w-9 rounded-lg p-0 text-muted-foreground transition-all duration-200 hover:bg-slate-100/80 hover:text-foreground"
                >
                  <Bell className="size-4" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)]">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>{t('nav.notifications')}</span>
                  {unreadCount > 0 ? (
                    <Badge variant="secondary" className="text-xs">{unreadCount} {t('nav.unread')}</Badge>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    {t('nav.noNotifications')}
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => {
                    const text = translateNotificationText(notif, language);
                    const pin = getNotificationPin(text);

                    return (
                      <DropdownMenuItem
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className="flex cursor-pointer flex-col items-start gap-1 px-3 py-2.5"
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className={`text-sm font-medium ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {translateNotificationTitle(notif, language)}
                          </span>
                          {!notif.read ? (
                            <span className="size-2 shrink-0 rounded-full bg-primary" />
                          ) : null}
                        </div>
                        <span className="whitespace-normal break-words text-xs leading-relaxed text-muted-foreground">
                          {text}
                        </span>
                        {pin ? (
                          <span className="mt-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 font-mono text-sm font-semibold tracking-widest text-primary">
                            PIN: {pin}
                          </span>
                        ) : null}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-slate-100/80 hover:text-foreground"
                >
                  <span className="avatar-gradient flex size-8 items-center justify-center rounded-full text-xs">{initials}</span>
                  {sessionUser?.username ? <span className="hidden text-sm font-medium md:block">{sessionUser.username}</span> : null}
                  <ChevronDown className="size-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {sessionUser?.username ? (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">{t('nav.signedInAs')}</span>
                        <span className="font-medium">@{sessionUser.username}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                {visibleAccountItems.map((item) => {
                  const icon = NAV_ICONS[item.to];

                  return (
                    <DropdownMenuItem asChild key={item.to}>
                      <Link href={item.to} className="flex items-center gap-2">
                        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                        {translateNavLabel(item.label)}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : authState === 'guest' ? (
            <div className="flex items-center gap-1.5">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-slate-100/80 hover:text-foreground"
              >
                <Link href={ROUTES.LOGIN} className="flex items-center gap-1.5">
                  <LogIn className="size-4" />
                  {t('nav.login')}
                </Link>
              </Button>
              <Button asChild size="sm" className="btn-glow h-8 rounded-lg px-4">
                <Link href={ROUTES.REGISTER} className="flex items-center gap-1.5">
                  <UserPlus className="size-4" />
                  {t('nav.register')}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>

        <div className="ml-auto lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-lg p-0 transition-all duration-200 hover:bg-slate-100/80"
              >
                <Menu className="size-4" />
                <span className="sr-only">{t('nav.openMenu')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {sessionUser?.username ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-2">
                      <span className="avatar-gradient flex size-8 items-center justify-center rounded-full text-xs">{initials}</span>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{t('nav.signedInAs')}</span>
                        <span className="font-medium">@{sessionUser.username}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              ) : null}

              <DropdownMenuLabel className="text-xs text-muted-foreground">{t('nav.navigation')}</DropdownMenuLabel>
              {visiblePrimaryItems.map((item) => {
                const icon = NAV_ICONS[item.to];
                const isActive = isRouteActive(pathname, item.to);

                return (
                  <DropdownMenuItem asChild key={item.to}>
                    <Link href={item.to} className={cn('flex items-center gap-2', isActive && 'font-medium text-primary')}>
                      {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                      {translateNavLabel(item.label)}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              {isAuthenticated ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={ticketNavItem.to} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{NAV_ICONS[ROUTES.TICKETS]}</span>
                      {translateNavLabel(ticketNavItem.label)}
                    </Link>
                  </DropdownMenuItem>
                  {operationsItems.length > 0 ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">{t('nav.operations')}</DropdownMenuLabel>
                      {operationsItems.map((item) => {
                        const icon = NAV_ICONS[item.to];

                        return (
                          <DropdownMenuItem asChild key={item.to}>
                            <Link href={item.to} className="flex items-center gap-2">
                              {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                              {translateNavLabel(item.label)}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  ) : null}

                  {isAdmin ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">{t('nav.admin')}</DropdownMenuLabel>
                      {ADMIN_NAV_ITEMS.map((item) => {
                        const icon = NAV_ICONS[item.to];

                        return (
                          <DropdownMenuItem asChild key={item.to}>
                            <Link href={item.to} className="flex items-center gap-2">
                              {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                              {translateNavLabel(item.label)}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  ) : null}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">{t('nav.account')}</DropdownMenuLabel>
                  {visibleAccountItems.map((item) => {
                    const icon = NAV_ICONS[item.to];

                    return (
                      <DropdownMenuItem asChild key={item.to}>
                        <Link href={item.to} className="flex items-center gap-2">
                          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                          {translateNavLabel(item.label)}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </>
              ) : authState === 'guest' ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">{t('nav.authentication')}</DropdownMenuLabel>
                  {AUTH_NAV_ITEMS.map((item) => {
                    const icon = NAV_ICONS[item.to];

                    return (
                      <DropdownMenuItem asChild key={item.to}>
                        <Link href={item.to} className="flex items-center gap-2">
                          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                          {translateNavLabel(item.label)}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Dialog open={Boolean(reviewNotification)} onOpenChange={(open) => !open && setReviewNotification(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t('nav.adminReviewTitle')}</DialogTitle>
            <DialogDescription>
              {t('nav.adminReviewDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-slate-50 px-4 py-3 text-sm leading-relaxed text-foreground">
            {reviewNotification ? translateNotificationText(reviewNotification, language) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => void handleReviewReject()}>
              {t('common.reject')}
            </Button>
            <Button type="button" onClick={() => void handleReviewJoin()}>
              {t('common.join')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
