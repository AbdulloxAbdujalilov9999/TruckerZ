import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { OWNER_ONLY_PREFIXES, ROLE_BLOCKED_PREFIXES, type AppRole } from "@/lib/nav";

const PUBLIC_PATHS = ["/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isApiAuth = pathname.startsWith("/api/auth");

  if (isApiAuth) return NextResponse.next();

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const role = req.auth?.user?.role as AppRole | undefined;
  const isOwnerOnly = OWNER_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  if (isOwnerOnly && role !== "OWNER") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const blockedForRole = role ? ROLE_BLOCKED_PREFIXES[role] : [];
  if (blockedForRole.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
