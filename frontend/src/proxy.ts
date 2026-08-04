import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { stripBasePath, withBasePath } from "@/lib/base-path";

const secret = new TextEncoder().encode(process.env.JWT_SECRET?.trim());

const buildRedirectURL = (request: NextRequest, path: string) => {
  return new URL(withBasePath(path), request.url);
};

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("Authorization")?.value;
  console.log("TOKEN:", token);
  const url = request.nextUrl;
  const pathname = stripBasePath(url.pathname);

  // TODO: Handle root "/"
  if (pathname === "/") {
    if (!token) {
      return NextResponse.redirect(buildRedirectURL(request, "/login"));
    }

    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      console.log("PAYLOAD:", payload);
      return NextResponse.redirect(buildRedirectURL(request, "/dashboard"));
    } catch (err) {
      console.log(err);
      return NextResponse.redirect(buildRedirectURL(request, "/login"));
    }
  }

  // TODO: Handle Public Routes
  if (pathname.startsWith("/login")) {
    if (token) {
      return NextResponse.redirect(buildRedirectURL(request, "/dashboard"));
    }
  }

  // TODO: Handle Protected Routes
  const protectedRoutes = [
    "/dashboard",
    "/master-report",
    "/assessment-manager",
    "/assessment-type-manager",
    "/assignments",
    "/report-mentoring",
    "/cv-analysis",
  ];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(buildRedirectURL(request, "/login"));
    }

    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      console.log("PAYLOAD:", payload);
      return NextResponse.next();
    } catch (err) {
      console.log("ERROR VERIFY:", (err as Error).message);
      return NextResponse.redirect(buildRedirectURL(request, "/login"));
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
    "/cv-analysis/:path*",
  ],
};
