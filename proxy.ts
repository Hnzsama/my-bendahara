import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * proxy.ts — Proteksi Rute & Interceptor Terpusat KeuanganAngkatan
 * Mengamankan seluruh rute administrasi (/admin/*, /dashboard/*)
 * dan mengalihkan user yang belum terautentikasi ke /login.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/dashboard");
  const isLoginPage = pathname === "/login";

  // Verifikasi sesi NextAuth v5
  const session = await auth();

  // 1. Jika mencoba mengakses rute admin tanpa sesi, alihkan ke /login
  if (isProtectedAdminRoute && !session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika bendahara sudah login dan membuka /login, alihkan ke /dashboard
  if (isLoginPage && session?.user) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3. Pasang Security Headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/login",
  ],
};

export default proxy;
