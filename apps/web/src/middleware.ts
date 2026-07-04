// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "scheduler_session";

function getSession(request: NextRequest): { id: string; role: string } | null {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (!cookie) return null;
    return JSON.parse(Buffer.from(cookie, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow these through — no auth checks
  if (
    pathname.startsWith("/schedule/login") ||
    pathname.startsWith("/schedule/logout") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = getSession(request);

  // Protect /dashboard — managers only
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/schedule/login", request.url));
    }
    if (session.role !== "manager") {
      return NextResponse.redirect(new URL(`/schedule/${session.id}`, request.url));
    }
    return NextResponse.next();
  }

  // Protect /schedule/[id] — must be logged in, employees can only see their own
  const scheduleMatch = pathname.match(/^\/schedule\/([^/]+)$/);
  if (scheduleMatch) {
    if (!session) {
      return NextResponse.redirect(new URL("/schedule/login", request.url));
    }
    if (session.role !== "manager" && session.id !== scheduleMatch[1]) {
      return NextResponse.redirect(new URL(`/schedule/${session.id}`, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
