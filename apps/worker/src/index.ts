import { Worker } from 'bullmq';
import { TranscodeJobData } from '@soundmap/shared';
import IORedis from 'ioredis';
import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from "@aws-sdk/lib-storage";
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';
import { promisify } from 'util';
import { pipeline } from 'stream';

const streamPipeline = promisify(pipeline);

// --- CONFIGURATION ---
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:3900';
const PUBLIC_S3_ENDPOINT = process.env.PUBLIC_S3_ENDPOINT || 'http://localhost:3900'; // For browser access
const S3_REGION = process.env.S3_REGION || 'garage';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
const S3_BUCKET = process.env.S3_BUCKET_SOUNDS || 'sounds';

// --- INFRASTRUCTURE ---
const redisConnection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const s3Client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
    forcePathStyle: true
});

console.log('🚀 Decoupled Audio Worker started');
console.log(`🔌 Connected to Redis at ${REDIS_URL}`);
console.log(`📦 Using S3 Bucket: ${S3_BUCKET}`);

// --- HELPERS ---
async function downloadFromS3(key: string, localPath: string) {
    console.log(`⬇️ Downloading ${key} to ${localPath}...`);
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
    const response = await s3Client.send(command);
    if (!response.Body) throw new Error('Empty body from S3');
    await streamPipeline(response.Body as Readable, fs.createWriteStream(localPath));
}

async function uploadToS3(key: string, localPath: string, contentType: string) {
    console.log(`⬆️ Uploading ${key}...`);
    const fileStream = fs.createReadStream(localPath);
    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: S3_BUCKET,
            Key: key,
            Body: fileStream,
            ContentType: contentType,
            ACL: 'public-read'
        },
    });
    await upload.done();
    return `${PUBLIC_S3_ENDPOINT}/${S3_BUCKET}/${key}`;
}

// --- WORKER LOGIC ---
const worker = new Worker<TranscodeJobData>('transcode', async (job) => {
    console.log(`Job ${job.id} processing...`, job.data);
    const { soundId, s3Key, webhookUrl, secret } = job.data;

    // Validation
    if (!s3Key) throw new Error('Missing s3Key in job data');
    if (!soundId) throw new Error('Missing soundId in job data');

    const tmpDir = os.tmpdir();
    const originalFile = path.join(tmpDir, `input-${job.id}`);
    const mp3File = path.join(tmpDir, `output-${job.id}.mp3`);

    try {
        // 1. Download
        await downloadFromS3(s3Key, originalFile);

        // 2a. Extract Metadata
        console.log('📊 Extracting metadata...');
        const metadata = await new Promise<any>((resolve, reject) => {
            ffmpeg.ffprobe(originalFile, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });

        // Parse metadata
        const audioStream = metadata.streams.find((s: any) => s.codec_type === 'audio');
        const format = metadata.format;

        const technicalMetadata = {
            duration: format.duration ? parseFloat(format.duration) : 0,
            sampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : 0,
            bitrate: format.bit_rate ? parseInt(format.bit_rate) : 0,
            channels: audioStream?.channels || 1,
            channelLayout: audioStream?.channel_layout || 'mono',
            codec: audioStream?.codec_name || 'unknown',
            fileFormat: format.format_name?.split(',')[0] || 'unknown',
            bitDepth: audioStream?.bits_per_sample || 0, // Sometimes implies 16/24/32
        };

        console.log('📈 Metadata extracted:', technicalMetadata);

        // 2b. Transcode
        console.log('🎵 Transcoding to MP3...');
        await new Promise((resolve, reject) => {
            ffmpeg(originalFile)
                .toFormat('mp3')
                .audioBitrate('128k')
                .on('end', resolve)
                .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
                .save(mp3File);
        });

        // 3. Upload Result
        // Use a cleaner naming verification
        const mp3Key = s3Key.replace(/\.[^/.]+$/, "") + '.mp3';
        const mp3Url = await uploadToS3(mp3Key, mp3File, 'audio/mpeg');

        console.log(`✅ Job ${job.id} Success! MP3: ${mp3Url}`);

        // 4. Delete Original File from S3 (Optimize Storage)
        // 4. Delete Original File from S3 (Optimize Storage)
        if (s3Key === mp3Key) {
            console.log('ℹ️ Source and destination keys match. Skipping deletion to preserve result.');
        } else {
            console.log(`🗑️ Deleting original file: ${s3Key}`);
            try {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: s3Key
                }));
                console.log('✅ Original file deleted');
            } catch (cleanupError: any) {
                console.error('⚠️ Failed to delete original file:', cleanupError.message);
                // Non-critical error
            }
        }

        // Notify Web App via Webhook
        if (webhookUrl && secret) {
            try {
                console.log(`📞 Calling webhook: ${webhookUrl}`);
                await axios.post(webhookUrl, {
                    soundId,
                    status: 'ready',
                    mp3Url,
                    metadata: technicalMetadata, // Send metadata
                    secret
                });
                console.log('✅ Webhook notified successfully');
            } catch (webhookError: any) {
                console.error('❌ Failed to notify webhook:', webhookError.message);
            }
        }

        return { success: true, mp3Url };

    } catch (error: any) {
        console.error(`❌ Job ${job.id} Failed:`, error.message);

        // Notify Failure
        if (webhookUrl && secret) {
            try {
                await axios.post(webhookUrl, {
                    soundId,
                    status: 'failed',
                    secret
                });
            } catch (err) { /* ignore */ }
        }

        throw error;
    } finally {
        // Cleanup
        if (fs.existsSync(originalFile)) fs.unlinkSync(originalFile);
        if (fs.existsSync(mp3File)) fs.unlinkSync(mp3File);
    }

}, {
    connection: redisConnection,
    concurrency: 2
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error ${err.message}`);
});

