'use server';

import { auth } from '@/auth';
import { createSound, type NewSound } from '@soundmap/database';
import { uploadFileToS3 } from '@soundmap/shared';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Queue } from 'bullmq';
import { TranscodeJobData } from '@soundmap/shared';
import { syncUserFromKeycloak } from '@soundmap/database';

// Constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Parse Redis URL or use individual host/port
function getRedisConfig() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        try {
            const url = new URL(redisUrl);
            return {
                host: url.hostname,
                port: parseInt(url.port) || 6379,
                maxRetriesPerRequest: 3,
                connectTimeout: 10000, // 10 seconds
                commandTimeout: 5000,  // 5 seconds
            };
        } catch {
            // If URL parsing fails, fall back to defaults
        }
    }
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        commandTimeout: 5000,
    };
}

// Initialize Queue with error handling
const transcodeQueue = new Queue<TranscodeJobData>('transcode', {
    connection: getRedisConfig()
});

const uploadSchema = z.object({
    title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(100),
    description: z.string().max(1000).optional(),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    category: z.string().min(1, "Selecciona una categoría"),
    environment: z.enum(['interior', 'exterior', 'mixto']).optional(),
    equipment: z.string().max(100).optional(),
    tags: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
});

export async function uploadSound(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Debes iniciar sesión para subir sonidos');
    }

    // Ensure user exists in local DB
    const syncedUser = await syncUserFromKeycloak({
        sub: session.user.id,
        name: session.user.name || undefined,
        email: session.user.email || undefined,
        picture: session.user.image || undefined,
    });

    if (!syncedUser) {
        throw new Error('Error al sincronizar usuario con la base de datos');
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { error: 'No se ha seleccionado ningún archivo' };
    }

    // Validate allowed types
    const allowedTypes = [
        'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg',
        'audio/x-m4a', 'audio/mp4', 'audio/flac', 'audio/x-flac'
    ];
    if (!allowedTypes.includes(file.type)) {
        return { error: 'Formato de archivo no soportado. Usa MP3, WAV, OGG, FLAC o M4A.' };
    }

    if (file.size > MAX_FILE_SIZE) {
        return { error: `El archivo excede el límite de ${MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    // Parse text fields
    const rawData = {
        title: formData.get('title'),
        description: formData.get('description') || undefined,
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        category: formData.get('category'),
        environment: formData.get('environment') || undefined,
        equipment: formData.get('equipment') || undefined,
        tags: formData.get('tags') || undefined,
        address: formData.get('address') || undefined,
        city: formData.get('city') || undefined,
        country: formData.get('country') || undefined,
    };

    const validatedFields = uploadSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors).flat()[0];
        return { error: firstError || 'Datos inválidos' };
    }

    const data = validatedFields.data;

    // Parse tags string to array
    const tagsArray = data.tags
        ? data.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : undefined;

    try {
        // 1. Upload to S3 (Garage) with timeout
        console.log(`📤 Starting upload for file: ${file.name} (${file.size} bytes)`);
        const uploadStartTime = Date.now();

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const timestamp = Date.now();
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${session.user.id}/${timestamp}-${sanitizedFilename}`;
        const contentType = file.type || 'application/octet-stream';

        let fileUrl: string;
        try {
            fileUrl = await uploadFileToS3(key, buffer, contentType);
            const uploadDuration = Date.now() - uploadStartTime;
            console.log(`✅ File uploaded successfully in ${uploadDuration}ms: ${key}`);
        } catch (s3Error) {
            console.error('❌ S3 upload failed:', s3Error);
            throw new Error('Error al subir el archivo a almacenamiento. Verifica la conexión con Garage S3.');
        }

        // 2. Create DB Record (Sound) with extended fields
        console.log(`💾 Creating database record for sound...`);
        const newSound = await createSound({
            title: data.title,
            description: data.description || '',
            userId: syncedUser.id,
            latitude: data.latitude,
            longitude: data.longitude,
            category: data.category as NewSound['category'],
            environment: data.environment as NewSound['environment'],
            equipment: data.equipment,
            // weather removed
            tags: tagsArray,
            address: data.address,
            city: data.city,
            country: data.country,
            status: 'processing',
            license: 'CC-BY',
        });
        console.log(`✅ Sound record created with ID: ${newSound.id}`);

        // 3. Trigger BullMQ Worker
        try {
            // In Docker/production, use internal network URL (web:3000)
            // In development, use localhost
            const getWebhookBaseUrl = () => {
                if (process.env.INTERNAL_WEBHOOK_URL) return process.env.INTERNAL_WEBHOOK_URL;
                if (process.env.NODE_ENV === 'production') return 'http://web:3000';
                return process.env.NEXTAUTH_URL || 'http://localhost:3000';
            };
            const webhookUrl = `${getWebhookBaseUrl()}/api/webhooks/audio-complete`;
            console.log('🔔 Webhook URL:', webhookUrl);

            const jobStartTime = Date.now();
            const job = await transcodeQueue.add('process-audio', {
                soundId: newSound.id,
                originalUrl: fileUrl,
                s3Key: key,
                webhookUrl,
                secret: process.env.WORKER_SECRET || process.env.NEXTAUTH_SECRET,
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            });
            const jobDuration = Date.now() - jobStartTime;
            console.log(`✅ Job ${job.id} added to transcode queue in ${jobDuration}ms`);
        } catch (queueError: unknown) {
            console.error('❌ Failed to add job to queue:', queueError);
            // Don't fail the upload if queue is unavailable
            // The sound will remain in 'processing' state
            console.warn('⚠️ Sound uploaded but transcoding queue unavailable. Manual intervention may be required.');
            // Optionally mark sound as failed immediately
            // await updateSound(newSound.id, { status: 'failed' });
        }

        revalidatePath('/explorar');
        return { success: true, soundId: newSound.id };

    } catch (error) {
        console.error('Upload error:', error);
        if (error instanceof Error && error.message.includes('auth')) {
            return { error: 'Error de autenticación.' };
        }
        return { error: 'Error al subir el archivo. Inténtalo de nuevo más tarde.' };
    }
}
