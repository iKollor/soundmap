import { z } from 'zod';

// Constants
// ===========================================
// Constants
export * from './constants';

export * from './storage';

export const LICENSE_TYPES = ['CC0', 'CC-BY', 'CC-BY-SA'] as const;
export const USER_ROLES = ['user', 'moderator', 'admin'] as const;
export const SOUND_STATUSES = ['pending', 'processing', 'ready', 'failed'] as const;
export const ASSET_TYPES = ['original', 'hls', 'opus', 'waveform'] as const;

export const MAX_MIXER_TRACKS = 4;
export const MAX_UPLOAD_SIZE_MB = 50;
export const SUPPORTED_AUDIO_FORMATS = ['audio/wav', 'audio/mpeg', 'audio/mp3'] as const;

// Guayaquil center coordinates
export const DEFAULT_MAP_CENTER = {
    lat: -2.1894,
    lng: -79.8891,
    zoom: 12,
} as const;

// ===========================================
// Zod Schemas
// ===========================================

export const licenseSchema = z.enum(LICENSE_TYPES);
export const userRoleSchema = z.enum(USER_ROLES);
export const soundStatusSchema = z.enum(SOUND_STATUSES);

export const coordinatesSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

export const soundUploadSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    tags: z.array(z.string().max(30)).max(10).optional(),
    license: licenseSchema.default('CC-BY'),
    recordedAt: z.string().datetime().optional(),
});

export const mixTrackSchema = z.object({
    soundId: z.string().uuid(),
    startTime: z.number().min(0), // seconds
    endTime: z.number().min(0),   // seconds
    volume: z.number().min(0).max(1).default(0.8),
    pan: z.number().min(-1).max(1).default(0), // -1 = left, 0 = center, 1 = right
    loop: z.boolean().default(false),
});

export const mixSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().default(false),
    tracks: z.array(mixTrackSchema).max(MAX_MIXER_TRACKS),
});

// ===========================================
// Types (derived from schemas)
// ===========================================

export type License = z.infer<typeof licenseSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type SoundStatus = z.infer<typeof soundStatusSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type SoundUpload = z.infer<typeof soundUploadSchema>;
export type MixTrack = z.infer<typeof mixTrackSchema>;
export type Mix = z.infer<typeof mixSchema>;

// ===========================================
// Job Types (for BullMQ)
// ===========================================

export interface TranscodeJobData {
    soundId: string;
    // originalAssetId: string; // Not strictly needed for the worker if we have the file
    originalUrl: string;
    s3Key: string;
    webhookUrl?: string; // Optional: Web app can provide where to call back
    secret?: string;     // Optional: Security token for the callback
}

export interface WaveformJobData {
    soundId: string;
    audioUrl: string;
}

// Constants moved to constants.ts
