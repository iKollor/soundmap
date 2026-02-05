'use server';

import { auth } from '@/auth';
import { createSound } from '@soundmap/database';
import { uploadFileToS3 } from '@soundmap/shared';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Queue } from 'bullmq';
import { TranscodeJobData } from '@soundmap/shared';
import { syncUserFromKeycloak } from '@soundmap/database';

// Constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Initialize Queue
const transcodeQueue = new Queue<TranscodeJobData>('transcode', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    }
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
        // 1. Upload to S3 (Garage)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const timestamp = Date.now();
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${session.user.id}/${timestamp}-${sanitizedFilename}`;
        const contentType = file.type || 'application/octet-stream';

        const fileUrl = await uploadFileToS3(key, buffer, contentType);

        // 2. Create DB Record (Sound) with extended fields
        const newSound = await createSound({
            title: data.title,
            description: data.description || '',
            userId: syncedUser.id,
            latitude: data.latitude,
            longitude: data.longitude,
            category: data.category as any,
            environment: data.environment as any,
            equipment: data.equipment,
            // weather removed
            tags: tagsArray,
            address: data.address,
            city: data.city,
            country: data.country,
            status: 'processing',
            license: 'CC-BY',
        });

        // 3. Trigger BullMQ Worker
        try {
            const webhookUrl = `${process.env.INTERNAL_WEBHOOK_URL || process.env.NEXTAUTH_URL}/api/webhooks/audio-complete`;
            console.log('🔔 Webhook URL:', webhookUrl);

            await transcodeQueue.add('process-audio', {
                soundId: newSound.id,
                originalUrl: fileUrl,
                s3Key: key,
                webhookUrl,
                secret: process.env.WORKER_SECRET,
            });
            console.log('Job added to transcode queue');
        } catch (queueError) {
            console.error('Failed to add job to queue:', queueError);
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
