import type { FastifyInstance } from "fastify";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { checkStorage } from "../storage.js";

type Check = {
  ok: boolean;
  message: string;
  details?: Record<string, string | number | boolean>;
};

export async function registerSystemRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/system/status", async () => {
    const [database, storage] = await Promise.all([checkDatabase(), checkStorage()]);

    return {
      service: {
        ok: true,
        message: "Music Library API is running",
        details: {
          port: config.port,
          storageDriver: config.storageDriver,
        },
      },
      database,
      storage,
      config: {
        databaseUrl: redactDatabaseUrl(process.env.DATABASE_URL ?? ""),
        s3Endpoint: config.s3.endpoint ?? "",
        s3Bucket: config.s3.bucket,
        apiKeyHeader: "x-api-key",
      },
    };
  });
}

async function checkDatabase(): Promise<Check> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      message: "PostgreSQL connection is healthy",
      details: { target: redactDatabaseUrl(process.env.DATABASE_URL ?? "") },
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "PostgreSQL check failed",
      details: {
        hint:
          "If DATABASE_URL points to localhost:5433, run Docker Desktop and docker compose up -d.",
      },
    };
  }
}

function redactDatabaseUrl(value: string): string {
  if (!value) return "";

  try {
    const url = new URL(value);
    if (url.password) url.password = "****";
    return url.toString();
  } catch {
    return value.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
  }
}

