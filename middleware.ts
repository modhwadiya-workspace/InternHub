export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/departments/:path*",
    "/profile/:path*",
    "/users/:path*",
  ],
};