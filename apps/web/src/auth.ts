import NextAuth, { type NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Keycloak from 'next-auth/providers/keycloak';
import Credentials from 'next-auth/providers/credentials';
import { syncUserFromKeycloak } from '@soundmap/database';
import { authConfig } from './auth.config';

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
        error?: 'RefreshAccessTokenError';
    }
    interface User {
        id: string;
        roles?: string[];
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        roles: string[];
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
        error?: 'RefreshAccessTokenError';
    }
}

// Helper function to refresh access token
async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.KEYCLOAK_CLIENT_ID!);
        params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET!);
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', token.refreshToken!);

        const tokenUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to refresh token:', data);
            return { ...token, error: 'RefreshAccessTokenError' };
        }

        return {
            ...token,
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? token.refreshToken,
            expiresAt: Date.now() + (data.expires_in * 1000),
            error: undefined,
        };
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return { ...token, error: 'RefreshAccessTokenError' };
    }
}

// NextAuth configuration
export const config: NextAuthConfig = {
    ...authConfig,
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
        ...authConfig.callbacks,
        async signIn({ account, profile }) {
            // Helper for Social/Keycloak Login (Redirect flow)
            if (account?.provider === 'keycloak' && profile) {
                try {
                    await syncUserFromKeycloak({
                        sub: profile.sub ?? '',
                        name: profile.name ?? undefined,
                        email: profile.email ?? undefined,
                        picture: profile.picture ?? undefined,
                        preferred_username: profile.preferred_username ?? undefined,
                    });
                } catch (e) {
                    console.error('Sync failed', e);
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            // Initial sign in - persist user data to token
            if (user) {
                token.id = user.id;
                token.roles = user.roles || [];
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                token.expiresAt = user.expiresAt;
            }

            // Handle OAuth provider (Keycloak redirect flow)
            if (account?.provider === 'keycloak') {
                token.id = account.providerAccountId;
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at ? account.expires_at * 1000 : undefined;
                token.roles = [];
            }

            // Check if token needs refresh (5 minutes before expiry)
            if (token.expiresAt && token.refreshToken) {
                const shouldRefresh = Date.now() > (token.expiresAt - 5 * 60 * 1000);
                if (shouldRefresh) {
                    console.log('Refreshing access token...');
                    return await refreshAccessToken(token);
                }
            }

            return token;
        },
        async session({ session, token }) {
            // Pass token data to session
            if (token) {
                session.user.id = token.id;
                session.user.roles = token.roles || [];
                if (token.error) {
                    session.error = token.error;
                }
            }
            return session;
        },
    },
};

// Export the NextAuth instance with explicit typing
const nextAuth = NextAuth(config);

export const handlers: typeof nextAuth.handlers = nextAuth.handlers;
export const auth: typeof nextAuth.auth = nextAuth.auth;
export const signIn: typeof nextAuth.signIn = nextAuth.signIn;
export const signOut: typeof nextAuth.signOut = nextAuth.signOut;

