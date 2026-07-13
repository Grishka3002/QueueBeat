import { readFile } from "node:fs/promises";
import type { LicenseType } from "./generated/prisma/index.js";
import { config } from "./config.js";
import { downloadAuthorizedAudio } from "./http-download.js";
import { prisma } from "./db.js";
import { audioStorageKey, uploadAudioFile } from "./storage.js";

export type UrlImportInput = {
  sourceUrl: string;
  title?: string;
  artist?: string;
  durationSec?: number;
  license: {
    type: LicenseType;
    proofUrl: string;
    rightsHolder?: string;
    expiresAt?: string;
    territory?: string;
    notes?: string;
  };
};

const assetMetadataSelect = {
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
} as const;

export async function importFromUrl(input: UrlImportInput) {
  validateImportInput(input);

  const job = await prisma.importJob.create({
    data: {
      sourceUrl: input.sourceUrl,
      status: "RUNNING",
    },
  });

  try {
    const downloaded = await downloadAuthorizedAudio(input.sourceUrl);

    try {
      const existingAsset = await prisma.audioAsset.findUnique({
        where: { sha256: downloaded.sha256 },
        include: {
          track: {
            include: {
              assets: { select: assetMetadataSelect },
              licenses: true,
            },
          },
        },
      });

      if (existingAsset) {
        await prisma.trackLicense.create({
          data: licenseRecord(input, downloaded.finalUrl, existingAsset.trackId),
        });

        const completedJob = await prisma.importJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            trackId: existingAsset.trackId,
            sourceSha256: downloaded.sha256,
            reason: "Duplicate audio matched by SHA-256; license proof was attached to existing track.",
          },
          include: {
            track: {
              include: {
                assets: { select: assetMetadataSelect },
                licenses: true,
              },
            },
          },
        });

        return completedJob;
      }

      const audioData =
        config.storageDriver === "postgres" ? await readFile(downloaded.filePath) : undefined;
      const storageKey =
        config.storageDriver === "s3"
          ? audioStorageKey(downloaded.sha256, downloaded.mimeType)
          : undefined;

      if (config.storageDriver === "s3" && storageKey) {
        await uploadAudioFile({
          filePath: downloaded.filePath,
          storageKey,
          mimeType: downloaded.mimeType,
          byteSize: downloaded.byteSize,
        });
      }

      const title = input.title?.trim() || inferTitleFromUrl(downloaded.finalUrl);
      const artist = input.artist?.trim() || "Unknown Artist";

      return await prisma.$transaction(async (tx) => {
        const track = await tx.track.create({
          data: {
            title,
            artist,
            normalizedTitle: normalizeSearch(title),
            normalizedArtist: normalizeSearch(artist),
            durationSec: input.durationSec,
            assets: {
              create: {
                storageProvider: config.storageDriver === "postgres" ? "POSTGRES" : "S3",
                bucket: config.storageDriver === "s3" ? config.s3.bucket : undefined,
                storageKey,
                audioData,
                mimeType: downloaded.mimeType,
                byteSize: BigInt(downloaded.byteSize),
                sha256: downloaded.sha256,
                durationSec: input.durationSec,
              },
            },
            licenses: {
              create: licenseRecord(input, downloaded.finalUrl),
            },
          },
        });

        return tx.importJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            trackId: track.id,
            sourceSha256: downloaded.sha256,
          },
          include: {
            track: {
              include: {
                assets: { select: assetMetadataSelect },
                licenses: true,
              },
            },
          },
        });
      });
    } finally {
      await downloaded.cleanup();
    }
  } catch (error) {
    return prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        reason: error instanceof Error ? error.message : "Unknown import error",
      },
    });
  }
}

function validateImportInput(input: UrlImportInput): void {
  if (!input.sourceUrl) throw new Error("sourceUrl is required");
  if (!input.license?.type) throw new Error("license.type is required");
  if (!input.license?.proofUrl) throw new Error("license.proofUrl is required");
  if (input.durationSec !== undefined && input.durationSec <= 0) {
    throw new Error("durationSec must be positive");
  }
  if (input.license.expiresAt) {
    const expiresAt = new Date(input.license.expiresAt);
    if (Number.isNaN(expiresAt.valueOf())) {
      throw new Error("license.expiresAt must be a valid date");
    }
  }
}

function licenseRecord(input: UrlImportInput, sourceUrl: string, trackId?: string) {
  return {
    trackId,
    sourceUrl,
    type: input.license.type,
    proofUrl: input.license.proofUrl,
    rightsHolder: input.license.rightsHolder,
    expiresAt: input.license.expiresAt ? new Date(input.license.expiresAt) : undefined,
    territory: input.license.territory ?? "worldwide",
    notes: input.license.notes,
  };
}

function inferTitleFromUrl(rawUrl: string): string {
  const pathname = new URL(rawUrl).pathname;
  const filename = pathname.split("/").filter(Boolean).pop() ?? "Untitled Track";
  return decodeURIComponent(filename).replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
}

export function normalizeSearch(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
