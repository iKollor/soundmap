/**
 * Next.js Middleware for Auth.js
 * 
 * This is the official pattern recommended by Auth.js documentation.
 * All authorization logic is handled by the `authorized` callback in auth.config.ts
 * 
 * @see https://authjs.dev/getting-started/session-management/protecting#nextjs-middleware
 */
export { auth as middleware } from './auth';

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (maps, etc.)
         * - api/auth routes (handled by Auth.js)
         */
        '/((?!_next/static|_next/image|favicon.ico|maps|api/auth).*)',
    ],
};
