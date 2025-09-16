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
  if (url.pathname.startsWith("/dashboard")) {
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
  matcher: ["/", "/login", "/dashboard", "/dashboard/excel"],
};
