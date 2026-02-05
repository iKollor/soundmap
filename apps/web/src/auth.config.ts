import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

/**
 * Auth.js Edge-compatible configuration
 * This config is used by the middleware (runs on Edge Runtime)
 * Keep it lean - no database imports or heavy dependencies
 * 
 * @see https://authjs.dev/getting-started/session-management/protecting
 */
export const authConfig = {
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        /**
         * The `authorized` callback is the canonical way to protect routes in Next.js
         * It runs on every request matched by the middleware matcher
         */
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const pathname = nextUrl.pathname;

            // Routes that require authentication
            const protectedPatterns = [
                '/subir',
                '/perfil',
                '/mis-sonidos',
                '/mixer/guardar',
            ];

            const isProtectedRoute = protectedPatterns.some(route =>
                pathname.startsWith(route)
            );

            // Redirect unauthenticated users to sign in
            if (isProtectedRoute && !isLoggedIn) {
                const signInUrl = new URL('/auth/signin', nextUrl.origin);
                signInUrl.searchParams.set('callbackUrl', pathname);
                return NextResponse.redirect(signInUrl);
            }

            // Admin-only routes - check roles
            const adminPatterns = ['/admin'];
            const isAdminRoute = adminPatterns.some(route =>
                pathname.startsWith(route)
            );

            if (isAdminRoute) {
                if (!isLoggedIn) {
                    return NextResponse.redirect(new URL('/auth/signin', nextUrl.origin));
                }
                const roles = auth?.user?.roles || [];
                if (!roles.includes('admin')) {
                    return NextResponse.redirect(new URL('/403', nextUrl.origin));
                }
            }

            return true;
        },
    },
    providers: [], // Configured in auth.ts (providers need server-side code)
} satisfies NextAuthConfig;
