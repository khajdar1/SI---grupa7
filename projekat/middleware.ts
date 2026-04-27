import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES: string[] = ["/login", "/register", "/reset-password", "/logout"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    console.warn(
      `[Middleware] Unauthenticated access attempt — redirecting to /login. Path: ${pathname}`
    );
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirected", "1");

    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};