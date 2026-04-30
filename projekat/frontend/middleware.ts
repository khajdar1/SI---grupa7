import { NextRequest, NextResponse } from "next/server";

import { ROUTES } from "./src/constants";

const PUBLIC_ROUTES: string[] = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.RESET_PASSWORD,
  ROUTES.FAULT_REPORTS,
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === ROUTES.HOME) {
    return true;
  }

  return PUBLIC_ROUTES.some((route) => route !== ROUTES.HOME && pathname.startsWith(route));
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
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
