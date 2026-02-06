import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Set max duration to 5 minutes for large audio file streaming
export const maxDuration = 300;

const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:3900',
    region: process.env.S3_REGION || 'garage',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
    },
    forcePathStyle: true,
});

const BUCKET_NAME = process.env.S3_BUCKET_SOUNDS || 'sounds';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ path: string[] }> }
) {
    const params = await props.params;

    try {
        const key = params.path.join('/');
        console.log('🎵 Audio proxy request:', key);

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const response: GetObjectCommandOutput = await s3Client.send(command);

        if (!response.Body) {
            return new NextResponse('Not Found', { status: 404 });
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        const readable = response.Body as Readable;
        for await (const chunk of readable) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': response.ContentType || 'audio/mpeg',
                'Content-Length': String(response.ContentLength || buffer.length),
                'Cache-Control': 'public, max-age=31536000',
                'Accept-Ranges': 'bytes',
            },
        });
    } catch (error: any) {
        console.error('Audio proxy error:', error);
        if (error.name === 'NoSuchKey') {
            return new NextResponse('Not Found', { status: 404 });
        }
        return new NextResponse('Error fetching audio', { status: 500 });
    }
}
