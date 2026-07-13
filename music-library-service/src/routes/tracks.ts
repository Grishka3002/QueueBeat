import type { FastifyInstance } from "fastify";
import { requireApiKey } from "../auth.js";
import { prisma } from "../db.js";
import { getAudioObject, getSignedAudioUrl } from "../storage.js";
import { normalizeSearch } from "../import-service.js";

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

export async function registerTrackRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/tracks", { preHandler: requireApiKey }, async (request) => {
    const query = request.query as {
      query?: string;
      artist?: string;
      limit?: string;
      cursor?: string;
    };

    const limit = Math.min(Number.parseInt(query.limit ?? "25", 10) || 25, 100);
    const normalizedQuery = query.query ? normalizeSearch(query.query) : undefined;
    const normalizedArtist = query.artist ? normalizeSearch(query.artist) : undefined;

    const tracks = await prisma.track.findMany({
      take: limit,
      skip: query.cursor ? 1 : 0,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      where: {
        status: "ACTIVE",
        normalizedArtist: normalizedArtist
          ? { contains: normalizedArtist, mode: "insensitive" }
          : undefined,
        OR: normalizedQuery
          ? [
              { normalizedTitle: { contains: normalizedQuery, mode: "insensitive" } },
              { normalizedArtist: { contains: normalizedQuery, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: [{ artist: "asc" }, { title: "asc" }, { id: "asc" }],
      include: { assets: { select: assetMetadataSelect }, licenses: true },
    });

    return {
      items: tracks,
      nextCursor: tracks.length === limit ? tracks[tracks.length - 1]?.id : null,
    };
  });

  app.get("/v1/tracks/:id", { preHandler: requireApiKey }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const track = await prisma.track.findUnique({
      where: { id },
      include: { assets: { select: assetMetadataSelect }, licenses: true },
    });

    if (!track) {
      return reply.code(404).send({ error: "Track not found" });
    }

    return track;
  });

  app.get("/v1/tracks/:id/stream", { preHandler: requireApiKey }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as { proxy?: string };
    const track = await prisma.track.findUnique({
      where: { id },
      include: { assets: { orderBy: { createdAt: "asc" }, take: 1 } },
    });

    if (!track || track.status !== "ACTIVE") {
      return reply.code(404).send({ error: "Track not found" });
    }

    const asset = track.assets[0];
    if (!asset) {
      return reply.code(404).send({ error: "Track has no playable asset" });
    }

    if (asset.storageProvider === "POSTGRES") {
      if (!asset.audioData) {
        return reply.code(404).send({ error: "Track audio is missing from PostgreSQL" });
      }

      return reply
        .header("content-type", asset.mimeType)
        .header("content-length", asset.byteSize.toString())
        .header("cache-control", "private, max-age=300")
        .send(Buffer.from(asset.audioData));
    }

    if (!asset.storageKey) {
      return reply.code(404).send({ error: "Track has no storage key" });
    }

    if (query.proxy === "1") {
      const object = await getAudioObject(asset.storageKey);
      if (object.ContentType) reply.header("content-type", object.ContentType);
      if (object.ContentLength) reply.header("content-length", object.ContentLength.toString());
      return reply.header("cache-control", "private, max-age=300").send(object.Body);
    }

    const url = await getSignedAudioUrl(asset.storageKey);
    return reply.redirect(url);
  });
}
