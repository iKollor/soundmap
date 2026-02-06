import { db, sounds, soundAssets, eq, and } from '@soundmap/database';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Set max duration to 5 minutes for webhook processing
export const maxDuration = 300;

const callbackSchema = z.object({
    soundId: z.string(),
    status: z.enum(['ready', 'failed']),
    mp3Url: z.string().optional(),
    metadata: z.object({
        duration: z.number(),
        sampleRate: z.number(),
        bitrate: z.number(),
        channels: z.number(),
        channelLayout: z.string(),
        codec: z.string(),
        fileFormat: z.string(),
        bitDepth: z.number(),
    }).optional(),
    secret: z.string(),
});

export async function POST(req: Request) {
    console.log('📞 Webhook received!');

    try {
        const body = await req.json();
        console.log('📦 Webhook body:', body);

        const parsed = callbackSchema.safeParse(body);

        if (!parsed.success) {
            console.error('❌ Invalid webhook data:', parsed.error);
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const { soundId, status, mp3Url, metadata, secret } = parsed.data;
        console.log(`🔊 Processing sound ${soundId}, status: ${status}`);

        // Verify secret to prevent unauthorized updates
        const expectedSecret = process.env.WORKER_SECRET || process.env.NEXTAUTH_SECRET;
        if (secret !== expectedSecret) {
            console.error('❌ Unauthorized - secret mismatch');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (status === 'failed') {
            await db.update(sounds)
                .set({ status: 'failed' })
                .where(eq(sounds.id, soundId));
            console.log('✅ Sound marked as failed');
            return NextResponse.json({ success: true });
        }

        // If success, we expect mp3Url
        if (!mp3Url) {
            console.error('❌ Missing mp3Url');
            return NextResponse.json({ error: 'Missing mp3Url for ready status' }, { status: 400 });
        }

        // Update Sound status to ready AND technical metadata
        console.log('📝 Updating sound status and metadata...', { metadata });
        await db.update(sounds)
            .set({
                status: 'ready',
                ...(metadata ? {
                    duration: metadata.duration,
                    sampleRate: metadata.sampleRate,
                    bitrate: metadata.bitrate,
                    channels: metadata.channels,
                    // Validate channelLayout against enum or infer from channels
                    channelLayout: (function () {
                        const valid = ['mono', 'stereo', '5.1', '7.1', 'otro'];
                        if (valid.includes(metadata.channelLayout)) return metadata.channelLayout as any;
                        // Infer from channels if unknown
                        if (metadata.channels === 1) return 'mono';
                        if (metadata.channels === 2) return 'stereo';
                        if (metadata.channels === 6) return '5.1';
                        return 'otro';
                    })(),
                    codec: metadata.codec,
                    fileFormat: metadata.fileFormat,
                    bitDepth: metadata.bitDepth,
                } : {})
            })
            .where(eq(sounds.id, soundId));

        // Convert S3 URL to proxy URL for browser access
        // Input: http://localhost:3900/sounds/user-id/file.mp3
        // Output: /api/audio/user-id/file.mp3
        const s3UrlPattern = /https?:\/\/[^/]+\/sounds\/(.+)/;
        const match = mp3Url.match(s3UrlPattern);
        const proxyUrl = match ? `/api/audio/${match[1]}` : mp3Url;
        console.log('🔗 Proxy URL:', proxyUrl);

        // Check for existing asset using direct select (avoid db.query relations issue)
        console.log('🔍 Checking for existing asset...');
        const existingAssets = await db
            .select({ id: soundAssets.id })
            .from(soundAssets)
            .where(and(
                eq(soundAssets.soundId, soundId),
                eq(soundAssets.type, 'mp3')
            ))
            .limit(1);

        if (existingAssets.length === 0) {
            console.log('📦 Creating new MP3 asset...');
            await db.insert(soundAssets).values({
                soundId: soundId,
                type: 'mp3',
                url: proxyUrl, // Use proxy URL instead of direct S3 URL
                mimeType: 'audio/mpeg',
                fileSize: 0,
            });
            console.log('✅ Asset created successfully');
        } else {
            console.log(`⚠️ Asset already exists for sound ${soundId}, skipping insertion.`);
        }

        console.log('✅ Webhook processed successfully');
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ Webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

