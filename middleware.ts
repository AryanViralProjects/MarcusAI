import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define auth-only paths that require authentication
  const authOnlyPaths = ["/settings"];
  const isAuthOnlyPath = authOnlyPaths.some(authPath => path.startsWith(authPath));
  
  // Define public paths that redirect logged-in users away
  const publicPaths = ["/sign-in", "/sign-up"];
  const isPublicPath = publicPaths.includes(path);

  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect logic
  if (isPublicPath && token) {
    // If user is signed in and trying to access a public path
    // (like sign-in or sign-up), redirect to home page
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthOnlyPath && !token) {
    // If user is not signed in and trying to access a protected path like settings,
    // redirect to sign-in page
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Otherwise, continue with the request - allowing non-authenticated users
  // to access the main application features
  return NextResponse.next();
}

// Configure paths that should be checked by the middleware
export const config = {
  matcher: [
    "/settings/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
