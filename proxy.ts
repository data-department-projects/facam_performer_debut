import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/org-chart",
  "/admin",
  "/projects",
  "/committees",
  "/week-planner",
  "/etp-tracking",
  "/objectives",
  "/department-objectives",
  "/actions-to-process",
  "/help",
];

const PUBLIC_ONLY_PREFIXES = ["/login", "/reset-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublicOnly = PUBLIC_ONLY_PREFIXES.some((p) =>
    pathname.startsWith(p),
  );

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isPublicOnly && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/org-chart/:path*",
    "/admin/:path*",
    "/projects/:path*",
    "/committees/:path*",
    "/week-planner/:path*",
    "/etp-tracking/:path*",
    "/objectives/:path*",
    "/department-objectives/:path*",
    "/actions-to-process/:path*",
    "/help/:path*",
    "/login",
    "/reset-password",
  ],
};
