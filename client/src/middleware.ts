import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("auth_role")?.value;

  const fullPath = pathname + search;

  // 1. Admin routes protection (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", fullPath);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 2. Client Dashboard (/dashboard/*)
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", fullPath);
      return NextResponse.redirect(loginUrl);
    }
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 3. Client Bookings (/bookings/*)
  if (pathname.startsWith("/bookings")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", fullPath);
      return NextResponse.redirect(loginUrl);
    }
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/bookings", request.url));
    }
    return NextResponse.next();
  }

  // 4. Checkout routes (/checkout/*)
  if (pathname.startsWith("/checkout")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", fullPath);
      return NextResponse.redirect(loginUrl);
    }
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    const normalizedPath = pathname.replace(/\/$/, "");
    if (normalizedPath === "/checkout") {
      const clientSecret = request.nextUrl.searchParams.get("clientSecret");
      const bookingId = request.nextUrl.searchParams.get("bookingId");
      if (!clientSecret || !bookingId) {
        return NextResponse.redirect(new URL("/bookings", request.url));
      }
    } else if (
      normalizedPath === "/checkout/success" ||
      normalizedPath === "/checkout/cancel"
    ) {
      const bookingId = request.nextUrl.searchParams.get("bookingId");
      if (!bookingId) {
        return NextResponse.redirect(new URL("/bookings", request.url));
      }
    }

    return NextResponse.next();
  }

  // 5. Guest-only routes (/login, /register)
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/bookings",
    "/bookings/:path*",
    "/checkout",
    "/checkout/:path*",
    "/login",
    "/register",
  ],
};
