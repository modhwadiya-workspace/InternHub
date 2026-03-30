import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    //@ts-ignore
    const role = token?.user?.role;
    const path = req.nextUrl.pathname;

    // 1. Redirect loop protection & Role-based redirection
    
    // Admin-only routes
    if ((path.startsWith("/departments") || path.startsWith("/managers") || path.startsWith("/chat")) && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Manager & Admin routes (Interns management)
    // Interns should not see the /interns management page
    if (path.startsWith("/interns") && role === "intern") {
      return NextResponse.redirect(new URL("/profile", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/departments/:path*",
    "/managers/:path*",
    "/interns/:path*",
    "/profile/:path*",
    "/chat/:path*",
  ],
};