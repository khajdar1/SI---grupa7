'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
type SessionUser = {
  username?: string;
};
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

function isRouteActive(pathname: string, href: string): boolean {
  if (href === ROUTES.HOME) {
    return pathname === ROUTES.HOME;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = isRouteActive(pathname, item.to);

  return (
    <Link
      href={item.to}
      className={cn(
        'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground',
        isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : undefined,
      )}
    >
      {item.label}
    </Link>
  );
}

function NavigationMenu({
  label,
  items,
  pathname,
}: {
  label: string;
  items: readonly NavItem[];
  pathname: string;
}) {
  const hasActiveItem = items.some((item) => isRouteActive(pathname, item.to));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={hasActiveItem ? 'default' : 'ghost'}
          size="sm"
          className={cn('h-9 px-3 text-sm', !hasActiveItem ? 'text-muted-foreground' : undefined)}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem asChild key={item.to}>
            <Link href={item.to}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(normalizedPayload));
  } catch {
    return null;
  }
}

function hasAdminRole(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  const realmRoles = payload.realm_access?.roles ?? [];
  const clientRoles = Object.values(payload.resource_access ?? {}).flatMap(
    (clientAccess) => clientAccess.roles ?? [],
  );

  return [...realmRoles, ...clientRoles].some((role) =>
    ADMIN_ROLE_NAMES.has(role.toLowerCase()),
  );
}

function hasCompanyAdminRole(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  const realmRoles = payload.realm_access?.roles ?? [];
  const clientRoles = Object.values(payload.resource_access ?? {}).flatMap(
    (clientAccess) => clientAccess.roles ?? [],
  );

  return [...realmRoles, ...clientRoles].some((role) =>
    COMPANY_ADMIN_ROLE_NAMES.has(role.toLowerCase()),
  );
}

function hasHistoryAccess(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return false;
  }

  const realmRoles = payload.realm_access?.roles ?? [];
  const clientRoles = Object.values(payload.resource_access ?? {}).flatMap(
    (clientAccess) => clientAccess.roles ?? [],
  );

  return [...realmRoles, ...clientRoles].some((role) =>
    HISTORY_ROLE_NAMES.has(role.toLowerCase()),
  );
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
  const clientRoles = Object.values(payload.resource_access ?? {}).flatMap(
    (clientAccess) => clientAccess.roles ?? [],
  );

  return [...realmRoles, ...clientRoles].map((role) => role.toLowerCase());
}

export function AppNavigation() {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>('unknown');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [canUseOperations, setCanUseOperations] = useState(false);
  const [canViewHistory, setCanViewHistory] = useState(false);

  useEffect(() => {
    const readAuthState = () => {
      try {
        const token = window.localStorage.getItem('token');
        const rawUser = window.localStorage.getItem('user');
        const parsedUser = rawUser ? (JSON.parse(rawUser) as SessionUser) : null;
        const roles = getTokenRoles(token);

        setSessionUser(parsedUser);
        setIsAdmin(hasAdminRole(token));
        setIsCompanyAdmin(hasCompanyAdminRole(token));
        setCanUseOperations(roles.some((role) => OPERATION_ROLE_NAMES.has(role)));
        setCanViewHistory(hasHistoryAccess(token));
        setAuthState(token ? 'authenticated' : 'guest');
      } catch {
        setSessionUser(null);
        setIsAdmin(false);
        setIsCompanyAdmin(false);
        setCanUseOperations(false);
        setCanViewHistory(false);
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
    () => {
      if (!isAuthenticated) {
        return PRIMARY_NAV_ITEMS.filter((item) => item.to === ROUTES.HOME);
      }

      if (isCompanyAdmin && !isAdmin) {
        return PRIMARY_NAV_ITEMS.filter((item) => item.to === ROUTES.HOME);
      }

      if (!canUseOperations) {
        return PRIMARY_NAV_ITEMS.filter((item) =>
          item.to === ROUTES.HOME || item.to === ROUTES.DASHBOARD,
        );
      }

      return PRIMARY_NAV_ITEMS.filter((item) => item.to !== ROUTES.REPORTS);
    },
    [canUseOperations, isAdmin, isAuthenticated, isCompanyAdmin],
  );

  const visibleAccountItems = useMemo(
    () =>
      ACCOUNT_NAV_ITEMS.filter((item) =>
        item.to === ROUTES.COMPANY ? isCompanyAdmin : true,
      ),
    [isCompanyAdmin],
  );

  return (
    <header className="border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex w-full max-w-[var(--content-max-width)] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href={ROUTES.HOME} className="truncate text-base font-semibold tracking-tight">
            Service Interventions
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {visiblePrimaryItems.map((item) => (
              <NavigationLink key={item.to} item={item} pathname={pathname} />
            ))}
            {isAuthenticated ? (
              <>
                {canUseOperations && (!isCompanyAdmin || isAdmin) ? (
                  <NavigationMenu
                    label="Operations"
                    items={OPERATIONS_NAV_ITEMS.filter((item) =>
                      item.to === ROUTES.HISTORY ? canViewHistory : true,
                    )}
                    pathname={pathname}
                  />
                ) : null}
                {isAdmin ? <NavigationMenu label="Admin" items={ADMIN_NAV_ITEMS} pathname={pathname} /> : null}
              </>
            ) : null}
          </nav>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {isAuthenticated && sessionUser?.username ? (
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              @{sessionUser.username}
            </span>
          ) : null}

          {isAuthenticated ? (
            <>
              {visibleAccountItems.map((item) => (
                <NavigationLink key={item.to} item={item} pathname={pathname} />
              ))}
            </>
          ) : authState === 'guest' ? (
            <NavigationMenu label="Auth" items={AUTH_NAV_ITEMS} pathname={pathname} />
          ) : null}
        </div>

        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Main</DropdownMenuLabel>
              {visiblePrimaryItems.map((item) => (
                <DropdownMenuItem asChild key={item.to}>
                  <Link href={item.to}>{item.label}</Link>
                </DropdownMenuItem>
              ))}

              {isAuthenticated ? (
                <>
                  {canUseOperations && (!isCompanyAdmin || isAdmin) ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Operations</DropdownMenuLabel>
                      {OPERATIONS_NAV_ITEMS.filter((item) =>
                        item.to === ROUTES.HISTORY ? canViewHistory : true,
                      ).map((item) => (
                          <DropdownMenuItem asChild key={item.to}>
                            <Link href={item.to}>{item.label}</Link>
                          </DropdownMenuItem>
                        ))}
                    </>
                  ) : null}

                  {isAdmin ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Admin</DropdownMenuLabel>
                      {ADMIN_NAV_ITEMS.map((item) => (
                        <DropdownMenuItem asChild key={item.to}>
                          <Link href={item.to}>{item.label}</Link>
                        </DropdownMenuItem>
                      ))}
                    </>
                  ) : null}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  {visibleAccountItems.map((item) => (
                    <DropdownMenuItem asChild key={item.to}>
                      <Link href={item.to}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </>
              ) : authState === 'guest' ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Auth</DropdownMenuLabel>
                  {AUTH_NAV_ITEMS.map((item) => (
                    <DropdownMenuItem asChild key={item.to}>
                      <Link href={item.to}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
