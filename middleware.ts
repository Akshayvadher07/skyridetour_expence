import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth?.token;

    if ((pathname === "/" || pathname === "/login") && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/customers/:path*",
    "/trips/:path*",
    "/expenses/:path*",
    "/vehicles/:path*",
    "/drivers/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/toll-passes/:path*",
  ],
};
