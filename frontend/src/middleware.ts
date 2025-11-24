import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET?.trim());
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("Authorization")?.value;
  console.log("TOKEN:", token);
  const url = request.nextUrl;

  // TODO: Handle root "/"
  if (url.pathname === "/") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      console.log("PAYLOAD:", payload);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (err) {
      console.log(err);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // TODO: Handle Public Routes
  if (url.pathname.startsWith("/login")) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // TODO: Handle Protected Routes
  const protectedRoutes = [
    "/dashboard",
    "/master-report",
    "/assessment-manager",
    "/assessment-type-manager",
    "/crew-evaluation-system",
    "/assignments",
    "/value-assessment",
    "/report-mentoring",
  ];

  const isProtectedRoute = protectedRoutes.some((route) => url.pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      console.log("PAYLOAD:", payload);
      return NextResponse.next();
    } catch (err) {
      console.log("ERROR VERIFY:", (err as Error).message);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/master-report/:path*",
    "/assessment-manager/:path*",
    "/assessment-type-manager/:path*",
    "/crew-evaluation-system/:path*",
    "/assignments/:path*",
    "/value-assessment/:path*",
    "/report-mentoring/:path*",
  ],
};
