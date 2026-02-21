import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/register", "/api/auth"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  // Allow SDK and v1 API routes with API key auth (handled in route handlers)
  const isApiRoute = pathname.startsWith("/api/v1") || pathname.startsWith("/api/sdk");

  if (isApiRoute) return NextResponse.next();
  if (isPublic) return NextResponse.next();

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sdk.js).*)"],
};
