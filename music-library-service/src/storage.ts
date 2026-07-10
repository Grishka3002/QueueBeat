import { createReadStream } from "node:fs";
import {
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./config.js";

const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  forcePathStyle: config.s3.forcePathStyle,
});

export async function uploadAudioFile(input: {
  filePath: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
}): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: input.storageKey,
      Body: createReadStream(input.filePath),
      ContentType: input.mimeType,
      ContentLength: input.byteSize,
      Metadata: {
        purpose: "licensed-audio-library",
      },
    }),
  );
}

export async function getSignedAudioUrl(storageKey: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: storageKey,
    }),
    { expiresIn: config.s3.signedUrlTtlSeconds },
  );
}

export async function getAudioObject(storageKey: string) {
  return s3.send(
    new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: storageKey,
    }),
  );
}

export async function checkStorage(): Promise<{
  ok: boolean;
  message: string;
  details?: Record<string, string | number | boolean>;
}> {
  if (config.storageDriver === "postgres") {
    return {
      ok: true,
      message: "Audio storage is configured for PostgreSQL",
      details: { storageDriver: "postgres" },
    };
  }

  try {
    await s3.send(new HeadBucketCommand({ Bucket: config.s3.bucket }));
    return {
      ok: true,
      message: "MinIO / S3 bucket is reachable",
      details: {
        endpoint: config.s3.endpoint ?? "default-s3-endpoint",
        bucket: config.s3.bucket,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "MinIO / S3 check failed",
      details: {
        endpoint: config.s3.endpoint ?? "default-s3-endpoint",
        bucket: config.s3.bucket,
        hint: "For local MinIO, run Docker Desktop and docker compose up -d.",
      },
    };
  }
}

export function audioStorageKey(sha256: string, mimeType: string): string {
  const extension = extensionForMimeType(mimeType);
  return `audio/${sha256.slice(0, 2)}/${sha256}.${extension}`;
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("aac")) return "aac";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("flac")) return "flac";
  return "bin";
}
