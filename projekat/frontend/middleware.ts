import { NextRequest, NextResponse } from "next/server";

import { ROUTES } from "./src/constants";

const PUBLIC_ROUTES: string[] = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.RESET_PASSWORD,
  ROUTES.FAULT_REPORTS,
];

const GUEST_ONLY_ROUTES: string[] = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.RESET_PASSWORD];

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  if (token && GUEST_ONLY_ROUTES.some((route) => matchesRoute(pathname, route))) {
    const response = NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set("redirected", "1");

    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
