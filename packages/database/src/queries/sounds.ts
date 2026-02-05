import { db } from '..';
import { sounds, soundAssets, users, type NewSound, type NewSoundAsset } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Create a new sound record
 */
export async function createSound(data: NewSound) {
    const result = await db.insert(sounds).values(data).returning();
    return result[0];
}

/**
 * Create a new sound asset record
 */
export async function createSoundAsset(data: NewSoundAsset) {
    const result = await db.insert(soundAssets).values(data).returning();
    return result[0];
}

/**
 * Get sound by ID
 */
export async function getSoundById(id: string) {
    const result = await db.select().from(sounds).where(eq(sounds.id, id));
    return result[0] || null;
}

/**
 * Get all sounds (for map)
 */
export async function getAllSounds() {
    // Fetch sounds with their first available audio asset
    const results = await db
        .select({
            id: sounds.id,
            title: sounds.title,
            latitude: sounds.latitude,
            longitude: sounds.longitude,
            category: sounds.category,
            environment: sounds.environment,
            status: sounds.status,
            audioUrl: soundAssets.url,
            ownerId: users.keycloakId, // Select Keycloak ID for ownership check
        })
        .from(sounds)
        .leftJoin(users, eq(sounds.userId, users.id))
        .leftJoin(soundAssets, eq(sounds.id, soundAssets.soundId)); // Join without filtering type yet

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

    return Array.from(uniqueSounds.values());
}
