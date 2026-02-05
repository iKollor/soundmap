import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// S3 Client Configuration for Garage
export const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:3900',
    region: process.env.S3_REGION || 'garage',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
    },
    forcePathStyle: true, // Required for Garage/MinIO
});

export const BUCKET_NAME = process.env.S3_BUCKET_SOUNDS || 'sounds';

/**
 * Upload a file to S3
 * @param key The file path/key in S3 (e.g. "sounds/123/file.mp3")
 * @param body The file content (Buffer, string, or stream)
 * @param contentType The MIME type of the file
 */
export async function uploadFileToS3(key: string, body: Buffer | Uint8Array | Blob | string, contentType: string) {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: 'public-read', // Ensure public access if needed for playback
    });

    try {
        await s3Client.send(command);
        // Return the public URL
        // Use S3_ENDPOINT if available, otherwise assume localhost:3900
        // NOTE: For browser access, this must be reachable from the browser (e.g. http://localhost:3900)
        // If S3_ENDPOINT is internal (e.g. http://garage:3900), we need a separate public var.
        // For now, let's fallback to localhost:3900 if undefined, but use the correct env var name.
        const baseUrl = process.env.NEXT_PUBLIC_S3_ENDPOINT || process.env.S3_ENDPOINT || 'http://localhost:3900';
        return `${baseUrl}/${BUCKET_NAME}/${key}`;
    } catch (error) {
        console.error('S3 Upload Error:', error);
        throw error;
    }
}
