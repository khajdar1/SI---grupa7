'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  BarChart2,
  ChevronDown,
  ClipboardList,
  Clock,
  Cog,
  Home,
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
  KeyRound,
} from 'lucide-react';

import { ROUTES } from '@/constants';
import {
  ACCOUNT_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  AUTH_NAV_ITEMS,
  OPERATIONS_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
  type NavItem,
} from '@/constants/content';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type AuthState = 'unknown' | 'authenticated' | 'guest';
type SessionUser = { username?: string };

const ADMIN_ROLE_NAMES = new Set(['admin', 'administrator']);
const HISTORY_ROLE_NAMES = new Set(['serviser', 'koordinator', 'coordinator', 'management', 'menadzment']);

const NAV_ICONS: Record<string, React.ReactNode> = {
  '/': <Home className="size-4" />,
  '/dashboard': <LayoutDashboard className="size-4" />,
  '/fault-reports': <AlertTriangle className="size-4" />,
  '/interventions': <Wrench className="size-4" />,
  '/assignments': <UserCheck className="size-4" />,
  '/reports': <BarChart2 className="size-4" />,
  '/interventions/new': <Plus className="size-4" />,
  '/history': <Clock className="size-4" />,
  '/tickets': <Ticket className="size-4" />,
  '/map': <Map className="size-4" />,
  '/admin': <Users className="size-4" />,
  '/admin/categories': <Tag className="size-4" />,
  '/admin/sla-config': <Timer className="size-4" />,
  '/admin/attachment-config': <Paperclip className="size-4" />,
  '/profile': <User className="size-4" />,
  '/settings': <Settings className="size-4" />,
  '/logout': <LogOut className="size-4" />,
  '/login': <LogIn className="size-4" />,
  '/register': <UserPlus className="size-4" />,
  '/reset-password': <KeyRound className="size-4" />,
};

function isRouteActive(pathname: string, href: string): boolean {
  if (href === ROUTES.HOME) return pathname === ROUTES.HOME;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      realm_access?: { roles?: string[] };
      resource_access?: Record<string, { roles?: string[] }>;
    };
  } catch {
    return null;
  }
}

function hasAdminRole(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const roles = [
    ...(payload.realm_access?.roles ?? []),
    ...Object.values(payload.resource_access ?? {}).flatMap((c) => c.roles ?? []),
  ];
  return roles.some((r) => ADMIN_ROLE_NAMES.has(r.toLowerCase()));
}

function hasHistoryAccess(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const roles = [
    ...(payload.realm_access?.roles ?? []),
    ...Object.values(payload.resource_access ?? {}).flatMap((c) => c.roles ?? []),
  ];
  return roles.some((r) => HISTORY_ROLE_NAMES.has(r.toLowerCase()));
}

function NavLink({ item, pathname, showIcon = true }: { item: NavItem; pathname: string; showIcon?: boolean }) {
  const isActive = isRouteActive(pathname, item.to);
  const icon = NAV_ICONS[item.to];

  return (
    <Link
      href={item.to}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'nav-active-pill'
          : 'text-muted-foreground hover:text-foreground hover:bg-slate-100/80',
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
  icon: React.ReactNode;
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
            hasActiveItem ? 'nav-active-pill' : 'text-muted-foreground hover:text-foreground hover:bg-slate-100/80',
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
              <Link
                href={item.to}
                className={cn('flex items-center gap-2', isActive && 'text-primary font-medium')}
              >
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
  const [canViewHistory, setCanViewHistory] = useState(false);

  useEffect(() => {
    const readAuthState = () => {
      try {
        const token = window.localStorage.getItem('token');
        const rawUser = window.localStorage.getItem('user');
        const parsedUser = rawUser ? (JSON.parse(rawUser) as SessionUser) : null;
        setSessionUser(parsedUser);
        setIsAdmin(hasAdminRole(token));
        setCanViewHistory(hasHistoryAccess(token));
        setAuthState(token ? 'authenticated' : 'guest');
      } catch {
        setSessionUser(null);
        setIsAdmin(false);
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

  const visiblePrimaryItems = useMemo(
    () => (isAuthenticated ? PRIMARY_NAV_ITEMS : PRIMARY_NAV_ITEMS.filter((i) => i.to === ROUTES.HOME)),
    [isAuthenticated],
  );

  const operationsItems = useMemo(
    () =>
      canViewHistory
        ? [...OPERATIONS_NAV_ITEMS, { label: 'History', to: '/history' }]
        : OPERATIONS_NAV_ITEMS,
    [canViewHistory],
  );

  const initials = sessionUser?.username
    ? sessionUser.username.slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-md shadow-[0_1px_28px_rgba(15,23,42,0.07)]">
      <div className="mx-auto flex w-full max-w-[var(--content-max-width)] items-center justify-between gap-4 px-4 py-2.5 md:px-6">

        {/* Logo + primary nav */}
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={ROUTES.HOME}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="logo-mark flex size-8 items-center justify-center rounded-xl text-white">
              <Wrench className="size-4" />
            </div>
            <span className="hidden text-sm font-black tracking-tight sm:block gradient-text">
              ServisIS
            </span>
          </Link>

          <div className="hidden h-5 w-px bg-border lg:block" />

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Главна навигација">
            {visiblePrimaryItems.map((item) => (
              <NavLink key={item.to} item={item} pathname={pathname} />
            ))}
            {isAuthenticated ? (
              <>
                <NavDropdown
                  label="Operacije"
                  icon={<ClipboardList className="size-4" />}
                  items={operationsItems}
                  pathname={pathname}
                />
                {isAdmin ? (
                  <NavDropdown
                    label="Admin"
                    icon={<Shield className="size-4" />}
                    items={ADMIN_NAV_ITEMS}
                    pathname={pathname}
                  />
                ) : null}
              </>
            ) : null}
          </nav>
        </div>

        {/* Right side */}
        <div className="hidden items-center gap-2 sm:flex">
          {isAuthenticated ? (
            <>
              {/* User avatar + account dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 gap-2 px-2 text-sm text-muted-foreground hover:text-foreground hover:bg-slate-100/80 rounded-lg transition-all duration-200">
                    <span className="avatar-gradient flex size-8 items-center justify-center rounded-full text-xs">
                      {initials}
                    </span>
                    {sessionUser?.username ? (
                      <span className="hidden text-sm font-medium md:block">{sessionUser.username}</span>
                    ) : null}
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
                  {ACCOUNT_NAV_ITEMS.map((item) => {
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
            </>
          ) : authState === 'guest' ? (
            <div className="flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100/80 transition-all duration-200">
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

        {/* Mobile hamburger */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-9 w-9 rounded-lg p-0 hover:bg-slate-100/80 transition-all duration-200">
                <Menu className="size-4" />
                <span className="sr-only">Otvori meni</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">

              {sessionUser?.username ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-2">
                      <span className="avatar-gradient flex size-8 items-center justify-center rounded-full text-xs">
                        {initials}
                      </span>
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
                    <Link href={item.to} className={cn('flex items-center gap-2', isActive && 'text-primary font-medium')}>
                      {icon ? <span className="text-muted-foreground">{icon}</span> : null}
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              {isAuthenticated ? (
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
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Korisnički račun</DropdownMenuLabel>
                  {ACCOUNT_NAV_ITEMS.map((item) => {
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
