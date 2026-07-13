import type { FastifyInstance } from "fastify";
import { LicenseType } from "../generated/prisma/index.js";
import { requireApiKey } from "../auth.js";
import { importFromUrl, type UrlImportInput } from "../import-service.js";
import { prisma } from "../db.js";

const allowedLicenseTypes = new Set(Object.values(LicenseType));
const maxBatchSize = 50;

type BatchImportInput = {
  license?: UrlImportInput["license"];
  items?: Array<Omit<UrlImportInput, "license"> & { license?: UrlImportInput["license"] }>;
};

export async function registerImportRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/imports/url", { preHandler: requireApiKey }, async (request, reply) => {
    const body = request.body as UrlImportInput;

    if (!body || typeof body.sourceUrl !== "string" || body.sourceUrl.trim() === "") {
      return reply.code(400).send({ error: "sourceUrl is required" });
    }

    if (!body.license?.proofUrl) {
      return reply.code(400).send({ error: "license.proofUrl is required" });
    }

    if (!body?.license || !allowedLicenseTypes.has(body.license.type)) {
      return reply.code(400).send({
        error: `license.type must be one of: ${[...allowedLicenseTypes].join(", ")}`,
      });
    }

    let job;
    try {
      job = await importFromUrl(body);
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Invalid import request",
      });
    }

    const statusCode = job.status === "FAILED" ? 422 : 201;
    return reply.code(statusCode).send(job);
  });

  app.post("/v1/imports/urls", { preHandler: requireApiKey }, async (request, reply) => {
    const body = request.body as BatchImportInput;
    const items = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return reply.code(400).send({ error: "items must be a non-empty array" });
    }

    if (items.length > maxBatchSize) {
      return reply.code(400).send({ error: `items cannot contain more than ${maxBatchSize} links` });
    }

    const results = [];
    for (const item of items) {
      const license = item.license ?? body.license;
      if (!license) {
        results.push({
          sourceUrl: item.sourceUrl,
          status: "REJECTED",
          reason: "license is required for this item or as a batch default",
        });
        continue;
      }

      if (!allowedLicenseTypes.has(license.type)) {
        results.push({
          sourceUrl: item.sourceUrl,
          status: "REJECTED",
          reason: `license.type must be one of: ${[...allowedLicenseTypes].join(", ")}`,
        });
        continue;
      }

      try {
        results.push(
          await importFromUrl({
            ...item,
            license,
          }),
        );
      } catch (error) {
        results.push({
          sourceUrl: item.sourceUrl,
          status: "REJECTED",
          reason: error instanceof Error ? error.message : "Invalid import request",
        });
      }
    }

    return reply.code(207).send({ items: results });
  });

  app.get("/v1/imports/:id", { preHandler: requireApiKey }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await prisma.importJob.findUnique({
      where: { id },
      include: {
        track: {
          include: {
            assets: {
              select: {
                id: true,
                trackId: true,
                storageProvider: true,
                bucket: true,
                storageKey: true,
                mimeType: true,
                byteSize: true,
                sha256: true,
                durationSec: true,
                bitrateKbps: true,
                sampleRateHz: true,
                createdAt: true,
              },
            },
            licenses: true,
          },
        },
      },
    });

    if (!job) {
      return reply.code(404).send({ error: "Import job not found" });
    }

    return job;
  });
}
