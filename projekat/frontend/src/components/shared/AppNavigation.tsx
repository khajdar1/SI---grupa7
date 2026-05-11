'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  BarChart2,
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

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/constants';
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
type SessionUser = { username?: string };

const ADMIN_ROLE_NAMES = new Set(['admin', 'administrator']);
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
const MANAGEMENT_ROLE_NAMES = new Set(['menadzment', 'management', 'admin', 'administrator']);
const OPERATION_ROLE_NAMES = new Set([
  'korisnik',
  'serviser',
  'koordinator',
  'coordinator',
  'management',
  'menadzment',
  'admin',
  'administrator',
]);

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
  [ROUTES.MAP]: <Map className="size-4" />,
  [ROUTES.ADMIN]: <Users className="size-4" />,
  [ROUTES.ADMIN_COMPANIES]: <Shield className="size-4" />,
  [ROUTES.ADMIN_CATEGORY]: <Tag className="size-4" />,
  [ROUTES.ADMIN_SLA_CONFIG]: <Timer className="size-4" />,
  [ROUTES.ADMIN_ATTACHMENT_CONFIG]: <Paperclip className="size-4" />,
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

function isRouteActive(pathname: string, href: string): boolean {
  if (href === ROUTES.HOME) {
    return pathname === ROUTES.HOME;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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

function NavLink({ item, pathname, showIcon = true }: { item: NavItem; pathname: string; showIcon?: boolean }) {
  const isActive = isRouteActive(pathname, item.to);
  const icon = NAV_ICONS[item.to];

  return (
    <Link
      href={item.to}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive ? 'nav-active-pill' : 'text-muted-foreground hover:bg-slate-100/80 hover:text-foreground',
      )}
    >
      {showIcon && icon ? <span className="shrink-0">{icon}</span> : null}
      {item.label}
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
          {label}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => {
          const isActive = isRouteActive(pathname, item.to);
          const itemIcon = NAV_ICONS[item.to];

          return (
            <DropdownMenuItem asChild key={item.to}>
              <Link href={item.to} className={cn('flex items-center gap-2', isActive && 'font-medium text-primary')}>
                {itemIcon ? <span className="shrink-0 text-muted-foreground">{itemIcon}</span> : null}
                {item.label}
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
  const [authState, setAuthState] = useState<AuthState>('unknown');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [canUseOperations, setCanUseOperations] = useState(false);
  const [canViewHistory, setCanViewHistory] = useState(false);
  const [isManagement, setIsManagement] = useState(false);

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
        setCanUseOperations(roles.some((role) => OPERATION_ROLE_NAMES.has(role)));
        setCanViewHistory(roles.some((role) => HISTORY_ROLE_NAMES.has(role)));
        setIsManagement(hasRole(token, MANAGEMENT_ROLE_NAMES));
        setAuthState(token ? 'authenticated' : 'guest');
      } catch {
        setSessionUser(null);
        setIsAdmin(false);
        setIsCompanyAdmin(false);
        setCanUseOperations(false);
        setCanViewHistory(false);
        setIsManagement(false);
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

  const isAuthenticated = authState === 'authenticated';

  const visiblePrimaryItems = useMemo(() => {
    if (!isAuthenticated) {
      return PRIMARY_NAV_ITEMS.filter((item) => item.to === ROUTES.HOME);
    }

    if (isCompanyAdmin && !isAdmin) {
      return PRIMARY_NAV_ITEMS.filter((item) => item.to === ROUTES.HOME);
    }

    if (!canUseOperations) {
      return PRIMARY_NAV_ITEMS.filter((item) => item.to === ROUTES.HOME || item.to === ROUTES.DASHBOARD);
    }

    return PRIMARY_NAV_ITEMS;
  }, [canUseOperations, isAdmin, isAuthenticated, isCompanyAdmin]);

  const visibleAccountItems = useMemo(
    () => ACCOUNT_NAV_ITEMS.filter((item) => (item.to === ROUTES.COMPANY ? isCompanyAdmin : true)),
    [isCompanyAdmin],
  );

  const operationsItems = useMemo(() => {
    if (!canUseOperations || (isCompanyAdmin && !isAdmin)) {
      return [];
    }

    const items = OPERATIONS_NAV_ITEMS.filter((item) => (item.to === ROUTES.HISTORY ? canViewHistory : true));

    return isManagement ? [...items, ...MANAGEMENT_NAV_ITEMS] : items;
  }, [canUseOperations, canViewHistory, isAdmin, isCompanyAdmin, isManagement]);

  const initials = sessionUser?.username ? sessionUser.username.slice(0, 2).toUpperCase() : '?';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 shadow-[0_1px_28px_rgba(15,23,42,0.07)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[var(--content-max-width)] items-center justify-between gap-4 px-4 py-2.5 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={ROUTES.HOME} className="flex shrink-0 items-center gap-2">
            <div className="logo-mark flex size-8 items-center justify-center rounded-xl text-white">
              <Wrench className="size-4" />
            </div>
            <span className="gradient-text hidden text-sm font-black tracking-tight sm:block">ServisIS</span>
          </Link>

          <div className="hidden h-5 w-px bg-border lg:block" />

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Glavna navigacija">
            {visiblePrimaryItems.map((item) => (
              <NavLink key={item.to} item={item} pathname={pathname} />
            ))}
            {isAuthenticated ? (
              <>
                {operationsItems.length > 0 ? (
                  <NavDropdown
                    label="Operacije"
                    icon={<ClipboardList className="size-4" />}
                    items={operationsItems}
                    pathname={pathname}
                  />
                ) : null}
                {isAdmin ? (
                  <NavDropdown label="Admin" icon={<Shield className="size-4" />} items={ADMIN_NAV_ITEMS} pathname={pathname} />
                ) : null}
              </>
            ) : null}
          </nav>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
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
                        <span className="text-xs text-muted-foreground">Prijavljeni kao</span>
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
                        {item.label}
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
                  Prijava
                </Link>
              </Button>
              <Button asChild size="sm" className="btn-glow h-8 rounded-lg px-4">
                <Link href={ROUTES.REGISTER} className="flex items-center gap-1.5">
                  <UserPlus className="size-4" />
                  Registracija
                </Link>
              </Button>
            </div>
          ) : null}
        </div>

        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-lg p-0 transition-all duration-200 hover:bg-slate-100/80"
              >
                <Menu className="size-4" />
                <span className="sr-only">Otvori meni</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {sessionUser?.username ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-2">
                      <span className="avatar-gradient flex size-8 items-center justify-center rounded-full text-xs">{initials}</span>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Prijavljeni kao</span>
                        <span className="font-medium">@{sessionUser.username}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              ) : null}

              <DropdownMenuLabel className="text-xs text-muted-foreground">Navigacija</DropdownMenuLabel>
              {visiblePrimaryItems.map((item) => {
                const icon = NAV_ICONS[item.to];
                const isActive = isRouteActive(pathname, item.to);

                return (
                  <DropdownMenuItem asChild key={item.to}>
                    <Link href={item.to} className={cn('flex items-center gap-2', isActive && 'font-medium text-primary')}>
                      {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              {isAuthenticated ? (
                <>
                  {operationsItems.length > 0 ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Operacije</DropdownMenuLabel>
                      {operationsItems.map((item) => {
                        const icon = NAV_ICONS[item.to];

                        return (
                          <DropdownMenuItem asChild key={item.to}>
                            <Link href={item.to} className="flex items-center gap-2">
                              {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                              {item.label}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  ) : null}

                  {isAdmin ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Admin</DropdownMenuLabel>
                      {ADMIN_NAV_ITEMS.map((item) => {
                        const icon = NAV_ICONS[item.to];

                        return (
                          <DropdownMenuItem asChild key={item.to}>
                            <Link href={item.to} className="flex items-center gap-2">
                              {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                              {item.label}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  ) : null}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Korisnicki racun</DropdownMenuLabel>
                  {visibleAccountItems.map((item) => {
                    const icon = NAV_ICONS[item.to];

                    return (
                      <DropdownMenuItem asChild key={item.to}>
                        <Link href={item.to} className="flex items-center gap-2">
                          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </>
              ) : authState === 'guest' ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Prijava</DropdownMenuLabel>
                  {AUTH_NAV_ITEMS.map((item) => {
                    const icon = NAV_ICONS[item.to];

                    return (
                      <DropdownMenuItem asChild key={item.to}>
                        <Link href={item.to} className="flex items-center gap-2">
                          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                          {item.label}
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
    </header>
  );
}
