// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // This middleware runs on the server and cannot access client-side Firebase auth state
    // For client-side protection, use the ProtectedRoute component or useRequireAuth hook

    // You could implement server-side auth checking here if needed
    // For now, we'll let the client-side components handle auth protection

    return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};