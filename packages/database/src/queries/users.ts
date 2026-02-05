import { db } from '..';
import { users, type NewUser } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Find a user by their Keycloak ID
 */
export async function findUserByKeycloakId(keycloakId: string) {
    const result = await db.select().from(users).where(eq(users.keycloakId, keycloakId)).limit(1);
    return result[0] || null;
}

/**
 * Create a new user from Keycloak data
 */
export async function createUser(data: NewUser) {
    const result = await db.insert(users).values(data).returning();
    return result[0];
}

/**
 * Update user details
 */
export async function updateUser(id: string, data: Partial<NewUser>) {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
}

/**
 * Sync user from Keycloak login
 * - Creates user if not exists
 * - Updates profile info if exists
 */
export async function syncUserFromKeycloak(profile: {
    sub: string;
    name?: string;
    email?: string;
    picture?: string;
    preferred_username?: string
}) {
    const existingUser = await findUserByKeycloakId(profile.sub);

    if (existingUser) {
        // Update if profile changed
        if (existingUser.displayName !== profile.name || existingUser.avatarUrl !== profile.picture) {
            await updateUser(existingUser.id, {
                displayName: profile.name || profile.preferred_username,
                avatarUrl: profile.picture,
                updatedAt: new Date(),
            });
        }
        return existingUser;
    }

    // Create new user
    return await createUser({
        keycloakId: profile.sub,
        displayName: profile.name || profile.preferred_username,
        avatarUrl: profile.picture,
        role: 'user', // Default role
    });
}
