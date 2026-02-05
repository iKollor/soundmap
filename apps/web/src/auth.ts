import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import Credentials from 'next-auth/providers/credentials';
import type { Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { syncUserFromKeycloak } from '@soundmap/database';

/**
 * NextAuth.js v5 configuration for Keycloak SSO
 * This pattern follows the official Auth.js documentation for TypeScript
 * https://authjs.dev/getting-started/typescript
 */

// Extend the built-in session/jwt types
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            roles: string[];
        };
    }
    interface User {
        roles?: string[];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        keycloakId?: string;
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
        roles?: string[];
    }
}

// NextAuth configuration
const authConfig = {
    providers: [
        Keycloak({
            clientId: process.env.KEYCLOAK_CLIENT_ID ?? '',
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? '',
            issuer: process.env.KEYCLOAK_ISSUER ?? '',
        }),
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    // 1. Authenticate against Keycloak (Direct Access Grant)
                    const params = new URLSearchParams();
                    params.append('client_id', process.env.KEYCLOAK_CLIENT_ID!);
                    params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET!);
                    params.append('grant_type', 'password');
                    params.append('username', credentials.email as string);
                    params.append('password', credentials.password as string);
                    params.append('scope', 'openid profile email');

                    const tokenUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
                    const response = await fetch(tokenUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: params
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        console.error('Keycloak auth failed:', data);
                        return null;
                    }

                    // 2. Fetch User Profile
                    const userInfoUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`;
                    const userResponse = await fetch(userInfoUrl, {
                        headers: { 'Authorization': `Bearer ${data.access_token}` }
                    });

                    const profile = await userResponse.json();

                    if (!userResponse.ok) return null;

                    // 3. Sync with local DB
                    await syncUserFromKeycloak({
                        sub: profile.sub,
                        name: profile.name,
                        email: profile.email,
                        picture: profile.picture,
                        preferred_username: profile.preferred_username,
                    });

                    // 4. Return user object for JWT callback
                    return {
                        id: profile.sub,
                        name: profile.name || profile.preferred_username,
                        email: profile.email,
                        image: profile.picture,
                        accessToken: data.access_token,
                        refreshToken: data.refresh_token,
                        expiresAt: Date.now() + (data.expires_in * 1000),
                        roles: profile.realm_access?.roles || []
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }: any) {
            // Helper for Social/Keycloak Login (Redirect flow)
            if (account?.provider === 'keycloak' && profile) {
                try {
                    await syncUserFromKeycloak({
                        sub: profile.sub,
                        name: profile.name,
                        email: profile.email,
                        picture: profile.picture,
                        preferred_username: profile.preferred_username,
                    });
                } catch (e) {
                    console.error('Sync failed', e);
                }
            }
            return true;
        },
        jwt({ token, user, account, profile }: any) {
            // Initial sign in from Credentials Provider
            if (user) {
                token.keycloakId = user.id;
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                token.expiresAt = user.expiresAt;
                token.roles = user.roles;
            }
            // Initial sign in from Keycloak Provider
            else if (account && profile) {
                token.keycloakId = profile.sub;
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at ? account.expires_at * 1000 : Date.now() + 300000;
                token.roles = profile.realm_access?.roles || [];
            }
            return token;
        },
        session({ session, token }: { session: Session; token: JWT }) {
            if (session.user) {
                session.user.id = token.keycloakId ?? '';
                session.user.roles = token.roles ?? [];
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    session: {
        strategy: 'jwt' as const,
    },
    trustHost: true,
};

// Export the NextAuth instance with explicit typing
const nextAuth = NextAuth(authConfig);

export const handlers: typeof nextAuth.handlers = nextAuth.handlers;
export const auth: typeof nextAuth.auth = nextAuth.auth;
export const signIn: typeof nextAuth.signIn = nextAuth.signIn;
export const signOut: typeof nextAuth.signOut = nextAuth.signOut;
