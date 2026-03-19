import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "debatehub_token";

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];

    // Base64url -> base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (base64.length % 4)) % 4);

    const json = atob(base64 + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  const isDashboard = pathname.startsWith("/dashboard");
  const isSubmit = pathname.startsWith("/submit");
  const isAdmin = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";

  // Public pages
  if (!isDashboard && !isSubmit && !isAdmin) return NextResponse.next();

  // Admin routes
  if (isAdmin) {
    if (isAdminLogin) return NextResponse.next();
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    const payload = decodeJwtPayload(token);
    const role = (payload?.role as string | undefined) ?? null;
    if (role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // Organizer protected routes
  if (isDashboard || isSubmit) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/submit/:path*", "/admin/:path*"],
};

