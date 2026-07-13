import { loadLocalEnv } from "./env.js";

loadLocalEnv();

type Config = {
  port: number;
  apiKey: string;
  storageDriver: "postgres" | "s3";
  s3: {
    endpoint?: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle: boolean;
    signedUrlTtlSeconds: number;
  };
  imports: {
    maxBytes: number;
    userAgent: string;
  };
  providers: {
    maxTracksPerRun: number;
    maxQueueChunk: number;
    maxProcessBatch: number;
    maxItemAttempts: number;
  };
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function bool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (!value) return fallback;
  return value.toLowerCase() === "true";
}

function int(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer`);
  }
  return parsed;
}

function storageDriver(): "postgres" | "s3" {
  const value = (process.env.STORAGE_DRIVER ?? "postgres").toLowerCase();
  if (value !== "postgres" && value !== "s3") {
    throw new Error("STORAGE_DRIVER must be either 'postgres' or 's3'");
  }
  return value;
}

const selectedStorageDriver = storageDriver();

export const config: Config = {
  port: int("PORT", 4001),
  apiKey: required("API_KEY"),
  storageDriver: selectedStorageDriver,
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: selectedStorageDriver === "s3" ? required("S3_BUCKET") : (process.env.S3_BUCKET ?? ""),
    accessKeyId:
      selectedStorageDriver === "s3"
        ? required("S3_ACCESS_KEY_ID")
        : (process.env.S3_ACCESS_KEY_ID ?? ""),
    secretAccessKey:
      selectedStorageDriver === "s3"
        ? required("S3_SECRET_ACCESS_KEY")
        : (process.env.S3_SECRET_ACCESS_KEY ?? ""),
    forcePathStyle: bool("S3_FORCE_PATH_STYLE", false),
    signedUrlTtlSeconds: int("SIGNED_URL_TTL_SECONDS", 900),
  },
  imports: {
    maxBytes: int("MAX_IMPORT_BYTES", 100 * 1024 * 1024),
    userAgent: process.env.IMPORT_USER_AGENT ?? "QueueBeatMusicLibrary/0.1",
  },
  providers: {
    maxTracksPerRun: Math.min(int("MAX_PROVIDER_TRACKS_PER_RUN", 1_000_000), 1_000_000),
    maxQueueChunk: Math.min(int("MAX_PROVIDER_QUEUE_CHUNK", 1_000), 1_000),
    maxProcessBatch: Math.min(int("MAX_PROVIDER_PROCESS_BATCH", 100), 100),
    maxItemAttempts: Math.min(int("MAX_PROVIDER_ITEM_ATTEMPTS", 5), 20),
  },
};
