'use server';

import { db, sounds, soundAssets, users, eq, and } from '@soundmap/database';
import { auth } from '@/auth';

export interface UserSound {
    id: string;
    title: string;
    category: string;
    environment: string | null;
    status: 'pending' | 'processing' | 'ready' | 'failed';
    createdAt: Date;
    latitude: number;
    longitude: number;
    address: string | null;
    city: string | null;
    audioUrl: string | null;
    listenCount: number;
}

export async function getUserSounds(): Promise<UserSound[]> {
    const session = await auth();

    if (!session?.user?.id) {
        return [];
    }

    try {
        // Get the internal user ID from keycloak ID
        const userResult = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.keycloakId, session.user.id))
            .limit(1);

        if (!userResult[0]) {
            return [];
        }

        const userId = userResult[0].id;

        // Fetch user's sounds with their assets
        const results = await db
            .select({
                id: sounds.id,
                title: sounds.title,
                category: sounds.category,
                environment: sounds.environment,
                status: sounds.status,
                createdAt: sounds.createdAt,
                latitude: sounds.latitude,
                longitude: sounds.longitude,
                address: sounds.address,
                city: sounds.city,
                listenCount: sounds.listenCount,
                audioUrl: soundAssets.url,
            })
            .from(sounds)
            .leftJoin(soundAssets, and(
                eq(sounds.id, soundAssets.soundId),
                eq(soundAssets.type, 'mp3')
            ))
            .where(eq(sounds.userId, userId))
            .orderBy(sounds.createdAt);

        // Deduplicate (in case of multiple assets)
        const uniqueSounds = new Map<string, UserSound>();
        for (const row of results) {
            if (!uniqueSounds.has(row.id)) {
                uniqueSounds.set(row.id, {
                    id: row.id,
                    title: row.title,
                    category: row.category,
                    environment: row.environment,
                    status: row.status as UserSound['status'],
                    createdAt: row.createdAt,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    address: row.address,
                    city: row.city,
                    audioUrl: row.audioUrl,
                    listenCount: row.listenCount,
                });
            }
        }

        return Array.from(uniqueSounds.values()).reverse(); // Most recent first
    } catch (error) {
        console.error('Error fetching user sounds:', error);
        return [];
    }
}

export async function getUserStats() {
    const session = await auth();

    if (!session?.user?.id) {
        return { totalSounds: 0, totalListens: 0 };
    }

    try {
        const userResult = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.keycloakId, session.user.id))
            .limit(1);

        if (!userResult[0]) {
            return { totalSounds: 0, totalListens: 0 };
        }

        const userId = userResult[0].id;

        const userSounds = await db
            .select({
                listenCount: sounds.listenCount,
            })
            .from(sounds)
            .where(eq(sounds.userId, userId));

        const totalSounds = userSounds.length;
        const totalListens = userSounds.reduce((acc, s) => acc + (s.listenCount || 0), 0);

        return { totalSounds, totalListens };
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return { totalSounds: 0, totalListens: 0 };
    }
}
