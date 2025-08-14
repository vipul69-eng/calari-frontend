import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/home(.*)",
  "/track(.*)",
  "/settings(.*)",
  "/profile(.*)",
  "/analysis(.*)",
]);

export default clerkMiddleware(async(auth, req) => {
  // auth() returns the authentication state
  const { userId } = await auth();

  if (isProtectedRoute(req) && !userId) {
    // Redirect to sign-in if not authenticated
    const signInUrl = new URL("/", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
