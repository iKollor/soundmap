'use server';

import { getAllSounds, db, sounds as soundsTable, eq, users, soundAssets } from '@soundmap/database';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function getSounds() {
    try {
        const results = await db
            .select({
                id: soundsTable.id,
                title: soundsTable.title,
                latitude: soundsTable.latitude,
                longitude: soundsTable.longitude,
                category: soundsTable.category,
                environment: soundsTable.environment,
                status: soundsTable.status,
                audioUrl: soundAssets.url,
                ownerId: users.keycloakId,
                authorName: users.displayName,
            })
            .from(soundsTable)
            .leftJoin(users, eq(soundsTable.userId, users.id))
            .leftJoin(soundAssets, eq(soundsTable.id, soundAssets.soundId));

        // Deduplicate sounds, prioritizing processed audio (mp3/m3u8) over original
        const uniqueSounds = new Map();
        for (const row of results) {
            const existing = uniqueSounds.get(row.id);

            if (!existing) {
                uniqueSounds.set(row.id, row);
            } else {
                // Prioritize processed audio (.mp3 or .m3u8) over original files
                const isBetter = (url: string | null) => url && (url.endsWith('.mp3') || url.endsWith('.m3u8'));
                if (isBetter(row.audioUrl) && !isBetter(existing.audioUrl)) {
                    uniqueSounds.set(row.id, row);
                }
            }
        }

        return Array.from(uniqueSounds.values()).map(sound => ({
            id: sound.id,
            latitude: sound.latitude,
            longitude: sound.longitude,
            title: sound.title,
            category: sound.category,
            environment: sound.environment,
            status: sound.status as 'pending' | 'processing' | 'ready' | 'failed',
            audioUrl: sound.audioUrl || undefined,
            ownerId: sound.ownerId || undefined,
            authorName: sound.authorName || 'Anónimo',
        }));
    } catch (error) {
        console.error('Error fetching sounds:', error);
        return [];
    }
}

export async function deleteSound(soundId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('No autorizado');
    }

    // In a real app, verify ownership or admin role here.
    // For prototype/dev, we'll allow it.

    try {
        // Strict ownership check:
        // Get sound and its owner's Keycloak ID in one query
        const result = await db
            .select({
                soundId: soundsTable.id,
                ownerKeycloakId: users.keycloakId,
            })
            .from(soundsTable)
            .leftJoin(users, eq(soundsTable.userId, users.id))
            .where(eq(soundsTable.id, soundId))
            .limit(1);

        const soundRecord = result[0];

        if (!soundRecord) return false;

        // Verify ownership
        if (soundRecord.ownerKeycloakId !== session.user.id) {
            console.error("Unauthorized delete attempt", {
                resourceOwner: soundRecord.ownerKeycloakId,
                requester: session.user.id
            });
            return false;
        }

        await db.delete(soundsTable).where(eq(soundsTable.id, soundId));
        revalidatePath('/explorar');
        revalidatePath('/mis-sonidos');
        revalidatePath('/perfil');
        return true;
    } catch (error) {
        console.error('Error deleting sound:', error);
        return false;
    }
}
