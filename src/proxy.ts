import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("kf-auth-token")?.value;
  const { pathname } = request.nextUrl;

  // Define public routes
  const publicRoutes = ["/login", "/splash", "/setup", "/"];

  // Skip static assets, internal next assets, and api routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.includes(pathname);

  // If missing auth token and trying to access a protected route
  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If auth token exists and user goes to /login, redirect to main dashboard
  if (token && pathname === "/login") {
    const dashboardUrl = new URL("/dashboard/owner", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Matching paths configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
