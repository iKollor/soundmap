import {
    pgTable,
    uuid,
    text,
    timestamp,
    doublePrecision,
    jsonb,
    pgEnum,
    index,
    boolean,
    integer,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// Enums
export const licenseTypeEnum = pgEnum('license_type', ['CC0', 'CC-BY', 'CC-BY-SA']);
export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin']);
export const soundStatusEnum = pgEnum('sound_status', ['pending', 'processing', 'ready', 'failed']);
export const assetTypeEnum = pgEnum('asset_type', ['original', 'hls', 'opus', 'waveform', 'mp3']);

// Extended category enum for sound library
export const soundCategoryEnum = pgEnum('sound_category', [
    // Nature
    'naturaleza', 'animales', 'aves', 'insectos', 'agua', 'viento', 'lluvia', 'truenos',
    // Urban
    'urbano', 'trafico', 'vehiculos', 'motos', 'buses', 'trenes', 'aviones', 'barcos',
    // People
    'personas', 'voces', 'conversaciones', 'multitud', 'pasos', 'risas', 'aplausos',
    // Music & Events
    'musica', 'conciertos', 'estadios', 'instrumentos', 'canto',
    // Ambience
    'ambiente', 'cafeteria', 'mercado', 'parque', 'playa', 'bosque', 'campo',
    // Industrial
    'industrial', 'construccion', 'maquinaria', 'fabricas',
    // Home
    'hogar', 'electrodomesticos', 'puertas', 'campanas',
    // Tech
    'tecnologia', 'computadoras', 'electronica', 'notificaciones',
    // Other
    'otro'
]);

export const environmentEnum = pgEnum('environment_type', ['interior', 'exterior', 'mixto']);

export const channelLayoutEnum = pgEnum('channel_layout', ['mono', 'stereo', '5.1', '7.1', 'otro']);

// Users table (reference to Keycloak users)
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    keycloakId: text('keycloak_id').notNull().unique(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    role: userRoleEnum('role').notNull().default('user'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sounds table - geom column added via SQL migration
export const sounds = pgTable('sounds', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id),
    title: text('title').notNull(),
    description: text('description'),

    // Location
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    address: text('address'), // reverse geocoded
    city: text('city'),
    country: text('country'),

    // Classification
    category: soundCategoryEnum('category').notNull().default('otro'),
    environment: environmentEnum('environment'),
    tags: text('tags').array(),
    license: licenseTypeEnum('license').notNull().default('CC-BY'),

    // Recording info (user input)
    recordedAt: timestamp('recorded_at'),
    equipment: text('equipment'),
    weather: text('weather'),

    // Audio technical metadata (extracted by FFprobe)
    duration: doublePrecision('duration'), // seconds
    sampleRate: integer('sample_rate'), // Hz (44100, 48000, 96000)
    bitDepth: integer('bit_depth'), // bits (16, 24, 32)
    bitrate: integer('bitrate'), // kbps
    channels: integer('channels'), // 1=mono, 2=stereo, 6=5.1
    channelLayout: channelLayoutEnum('channel_layout'),
    codec: text('codec'), // pcm, mp3, aac, flac, opus
    fileFormat: text('file_format'), // wav, mp3, ogg, m4a

    // Stats
    listenCount: integer('listen_count').notNull().default(0),

    // Status
    status: soundStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index('sounds_user_id_idx').on(table.userId),
    statusIdx: index('sounds_status_idx').on(table.status),
    categoryIdx: index('sounds_category_idx').on(table.category),
}));

// Sound assets - different file formats/versions
export const soundAssets = pgTable('sound_assets', {
    id: uuid('id').primaryKey().defaultRandom(),
    soundId: uuid('sound_id').notNull().references(() => sounds.id, { onDelete: 'cascade' }),
    type: assetTypeEnum('type').notNull(),
    url: text('url').notNull(),
    mimeType: text('mime_type'),
    fileSize: doublePrecision('file_size'), // in bytes
    metadata: jsonb('metadata'), // format-specific metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    soundIdIdx: index('sound_assets_sound_id_idx').on(table.soundId),
    typeIdx: index('sound_assets_type_idx').on(table.type),
}));

// Mixes - user-created compositions
export const mixes = pgTable('mixes', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id),
    title: text('title').notNull(),
    description: text('description'),
    isPublic: boolean('is_public').notNull().default(false),

    // Mix structure: array of track configs
    // Each track: { soundId, startTime, endTime, volume, pan, loop }
    tracks: jsonb('tracks').notNull().default(sql`'[]'::jsonb`),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index('mixes_user_id_idx').on(table.userId),
}));

// Relations
// ===========================================

export const usersRelations = relations(users, ({ many }) => ({
    sounds: many(sounds),
    mixes: many(mixes),
}));

export const soundsRelations = relations(sounds, ({ one, many }) => ({
    user: one(users, {
        fields: [sounds.userId],
        references: [users.id],
    }),
    assets: many(soundAssets),
}));

export const soundAssetsRelations = relations(soundAssets, ({ one }) => ({
    sound: one(sounds, {
        fields: [soundAssets.soundId],
        references: [sounds.id],
    }),
}));

export const mixesRelations = relations(mixes, ({ one }) => ({
    user: one(users, {
        fields: [mixes.userId],
        references: [users.id],
    }),
}));

// Type exports for use in app
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Sound = typeof sounds.$inferSelect;
export type NewSound = typeof sounds.$inferInsert;
export type SoundAsset = typeof soundAssets.$inferSelect;
export type NewSoundAsset = typeof soundAssets.$inferInsert;
export type Mix = typeof mixes.$inferSelect;
export type NewMix = typeof mixes.$inferInsert;

// Category options export for forms
// Types for use in app are exported above
