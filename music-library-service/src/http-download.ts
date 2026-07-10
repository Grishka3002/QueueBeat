import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { config } from "./config.js";

const allowedAudioTypes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
];

export type DownloadedAudio = {
  filePath: string;
  finalUrl: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
  cleanup: () => Promise<void>;
};

export async function downloadAuthorizedAudio(
  sourceUrl: string,
): Promise<DownloadedAudio> {
  let currentUrl = await assertPublicHttpUrl(sourceUrl);

  for (let redirectCount = 0; redirectCount < 5; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers: { "user-agent": config.imports.userAgent },
    });

    if (isRedirect(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect response did not include Location");
      currentUrl = await assertPublicHttpUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error(`Source returned HTTP ${response.status}`);
    }

    const mimeType = normalizeMimeType(response.headers.get("content-type"));
    if (!allowedAudioTypes.includes(mimeType)) {
      throw new Error(`Unsupported content type: ${mimeType}`);
    }

    const length = Number.parseInt(response.headers.get("content-length") ?? "0", 10);
    if (length > config.imports.maxBytes) {
      throw new Error("Source file is larger than MAX_IMPORT_BYTES");
    }

    if (!response.body) {
      throw new Error("Source response did not include a body");
    }

    const workDir = await makeImportTempDir();
    const filePath = join(workDir, "source-audio");
    const hash = createHash("sha256");
    let byteSize = 0;

    // `fetch` uses the DOM stream type while Node expects its own web-stream declaration.
    const bodyStream = Readable.fromWeb(response.body as never);
    bodyStream.on("data", (chunk: Buffer) => {
      byteSize += chunk.byteLength;
      if (byteSize > config.imports.maxBytes) {
        bodyStream.destroy(new Error("Source file is larger than MAX_IMPORT_BYTES"));
        return;
      }
      hash.update(chunk);
    });

    await pipeline(bodyStream, createWriteStream(filePath));

    return {
      filePath,
      finalUrl: currentUrl,
      mimeType,
      byteSize,
      sha256: hash.digest("hex"),
      cleanup: () => rm(workDir, { force: true, recursive: true }),
    };
  }

  throw new Error("Too many redirects");
}

async function makeImportTempDir(): Promise<string> {
  const dir = join(tmpdir(), `music-library-import-${Date.now()}-${Math.random()}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

function normalizeMimeType(contentType: string | null): string {
  return (contentType ?? "application/octet-stream").split(";")[0].trim().toLowerCase();
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

async function assertPublicHttpUrl(rawUrl: string): Promise<string> {
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP(S) URLs are supported");
  }

  const records = await lookup(url.hostname, { all: true });
  if (records.length === 0) {
    throw new Error("Source host could not be resolved");
  }

  for (const record of records) {
    if (isPrivateAddress(record.address)) {
      throw new Error("Private, localhost, and link-local source addresses are not allowed");
    }
  }

  return url.toString();
}

function isPrivateAddress(address: string): boolean {
  if (address === "localhost") return true;

  const version = isIP(address);
  if (version === 4) {
    const [a, b] = address.split(".").map((part) => Number.parseInt(part, 10));
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    );
  }

  if (version === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  return true;
}
