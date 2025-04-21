import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Protected routes that require authentication
const protectedRoutes = ["/feed", "/settings"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip middleware for non-protected routes
  if (!protectedRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Get the JWT token
  const token = await getToken({ req });

  // If there's no token, redirect to login
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", encodeURI(req.url));
    return NextResponse.redirect(url);
  }

  // Attach user ID to the request headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", token.sub as string);

  // Continue with the request
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Specify which paths the middleware should run on
  matcher: [
    // Apply to all routes except static files, API routes, and _next
    "/((?!_next/static|_next/image|api/auth|favicon.ico).*)",
  ],
}; 