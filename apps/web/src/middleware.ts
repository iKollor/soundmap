import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    // Protected routes that require authentication
    const protectedPatterns = [
        '/subir',
        '/perfil',
        '/mis-sonidos',
        '/mixer/guardar',
    ];

    const isProtectedRoute = protectedPatterns.some(pattern =>
        pathname.startsWith(pattern)
    );

    // Redirect unauthenticated users to sign in
    if (isProtectedRoute && !isLoggedIn) {
        const signInUrl = new URL('/auth/signin', req.nextUrl.origin);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
    }

    // Admin-only routes
    const adminPatterns = ['/admin'];
    const isAdminRoute = adminPatterns.some(pattern =>
        pathname.startsWith(pattern)
    );

    if (isAdminRoute) {
        const roles = req.auth?.user?.roles || [];
        if (!roles.includes('admin')) {
            return NextResponse.redirect(new URL('/403', req.nextUrl.origin));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Match all routes except static files and api
        '/((?!_next/static|_next/image|favicon.ico|maps|api/auth).*)',
    ],
};
