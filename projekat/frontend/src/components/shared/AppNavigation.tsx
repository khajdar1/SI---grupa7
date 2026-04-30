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

export function AppNavigation() {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>('unknown');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const readAuthState = () => {
      try {
        const token = window.localStorage.getItem('token');
        const rawUser = window.localStorage.getItem('user');
        const parsedUser = rawUser ? (JSON.parse(rawUser) as SessionUser) : null;

        setSessionUser(parsedUser);
        setAuthState(token ? 'authenticated' : 'guest');
      } catch {
        setSessionUser(null);
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
    () =>
      isAuthenticated
        ? PRIMARY_NAV_ITEMS
        : PRIMARY_NAV_ITEMS.filter((item) => item.to === ROUTES.HOME),
    [isAuthenticated],
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
                <NavigationMenu label="Operations" items={OPERATIONS_NAV_ITEMS} pathname={pathname} />
                <NavigationMenu label="Admin" items={ADMIN_NAV_ITEMS} pathname={pathname} />
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
              {ACCOUNT_NAV_ITEMS.map((item) => (
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
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Operations</DropdownMenuLabel>
                  {OPERATIONS_NAV_ITEMS.map((item) => (
                    <DropdownMenuItem asChild key={item.to}>
                      <Link href={item.to}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Admin</DropdownMenuLabel>
                  {ADMIN_NAV_ITEMS.map((item) => (
                    <DropdownMenuItem asChild key={item.to}>
                      <Link href={item.to}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  {ACCOUNT_NAV_ITEMS.map((item) => (
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
