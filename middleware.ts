import { NextRequest, NextResponse } from 'next/server';
import { getToken } from "next-auth/jwt";

// API paths that may need CORS headers in production
const apiRoutes = [
  /^\/api\/.*$/,
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Add CORS headers to API routes
  if (apiRoutes.some(pattern => pattern.test(path))) {
    // For OPTIONS (preflight) requests, return OK with headers
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
      return response;
    }
    
    // For regular API requests, add CORS headers and continue
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
  
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
    "/api/:path*", // Add API routes to the matcher
  ],
};
