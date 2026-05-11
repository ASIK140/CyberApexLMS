import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: !!process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'minioadmin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'minioadmin',
  },
});

const BUCKET = process.env.S3_BUCKET ?? 'sa-lms-local';

export async function uploadToS3(key: string, buffer: Buffer | Readable | Uint8Array, contentType: string): Promise<string> {
  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }),
  );
  return `${process.env.S3_PUBLIC_URL ?? ''}/${key}`;
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

export async function downloadFromS3(key: string): Promise<Readable> {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return Body as Readable;
}

export async function listObjects(prefix: string) {
  const { Contents } = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
  return Contents ?? [];
}
