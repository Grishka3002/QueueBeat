# Music Library Service

Microservice for building a large, searchable catalog of legally licensed tracks.
It ingests audio from authorized direct URLs, stores metadata in PostgreSQL,
stores audio files in S3-compatible object storage, and exposes a small API for
the main QueueBeat app.

This service intentionally does not bypass DRM, rip streaming platforms, or
download copyrighted music without permission. Every import requires license
metadata and proof.

## What It Owns

- Audio files in S3-compatible object storage: MinIO locally, S3/R2/Yandex
  Object Storage in production.
- Track metadata and license records in PostgreSQL.
- Deduplication by SHA-256.
- Short-lived playback/download URLs for trusted backend clients.
- Import audit trail for every source URL.

## Local Stack

- Node.js 22
- Fastify
- Prisma
- PostgreSQL
- S3-compatible storage, with MinIO for local development

## Quick Start

### Option A: Docker PostgreSQL + MinIO

Use this when Docker Desktop is installed. This is the recommended local setup
because it matches the intended architecture.

```powershell
cd music-library-service
copy .env.example .env
docker compose up -d
npm install
npm run prisma:push
npm run dev
```

PostgreSQL connection:

```text
host: localhost
port: 5433
database: music_library
user: music
password: music
```

MinIO console:

```text
url: http://localhost:9001
user: minioadmin
password: minioadmin
bucket: music-library
```

Health check:

```powershell
curl http://localhost:4001/health
```

Admin UI:

```text
http://localhost:4001
```

The UI shows PostgreSQL and MinIO / S3 health, setup hints, single-link import,
batch import, and recent tracks.

If setup fails, run:

```powershell
npm run doctor
```

It checks `.env`, Docker, PostgreSQL, and MinIO ports and prints the next step.

If the password for the locally installed PostgreSQL `postgres` user is lost,
run PowerShell as Administrator and execute:

```powershell
npm run postgres:reset-admin-password
```

The script temporarily allows only local password-reset access, resets the
password you enter, restores the original PostgreSQL authentication settings,
and restarts the PostgreSQL service.

### Option B: Local Windows PostgreSQL + External S3

Use this when Docker is not installed, but PostgreSQL is already running on your
machine and you have real S3/R2/Yandex Object Storage credentials.

Create the app database and role:

```powershell
cd music-library-service
copy .env.example .env
npm install
powershell -ExecutionPolicy Bypass -File .\scripts\create-local-postgres-db.ps1
npm run prisma:push
npm run dev
```

Then set `.env` to:

```env
DATABASE_URL="postgresql://music:music@localhost:5432/music_library?schema=public"
STORAGE_DRIVER="s3"
S3_ENDPOINT="your-s3-endpoint"
S3_BUCKET="your-bucket"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
```

The script may ask for the PostgreSQL admin password. That is the password for
the local `postgres` user that was set during PostgreSQL installation; this
project cannot know it automatically.

## Storage Mode

By default audio is saved to MinIO/S3:

```env
STORAGE_DRIVER="s3"
```

For a quick single-database prototype, you can store audio directly in
PostgreSQL:

```env
STORAGE_DRIVER="postgres"
```

This is convenient, but not recommended for a huge catalog.

## Hitmos Authorized Bulk Import

The service now has a provider queue designed for an authorized Hitmos catalog
of up to 1,000,000 tracks. It deliberately does not bypass `403`, CAPTCHA,
rate limits, or access controls. Before a parser is connected, Hitmos needs to
allow the service IP and provide a permitted catalog route or a sample page
template.

For any run above 10,000 tracks, set `STORAGE_DRIVER="s3"`. PostgreSQL stores
the catalog, rights references, item queue, and audit data; MinIO/S3 stores the
audio files.

1. Create a run in the admin UI or through the API. The agreement reference is
   kept with every imported item.
2. The authorized parser submits discovered entries to the queue in chunks of
   at most 1,000 records. Each item must contain the Hitmos page URL and a
   direct authorized audio URL.
3. Start the worker, which downloads one controlled batch at a time with
   retry/backoff and SHA-256 deduplication.
4. Seal the run only after the parser has reached the final catalog page. This
   prevents new entries from being added after the final import summary.

```powershell
npm run worker:providers
```

Create the run:

```powershell
curl -X POST http://localhost:4001/v1/providers/hitmos/runs `
  -H "content-type: application/json" `
  -H "x-api-key: dev-library-key" `
  -d '{
    "catalogRootUrl": "https://hitmos.me/",
    "agreementReference": "HITMOS-CONTRACT-2026",
    "maxTracks": 1000000,
    "licenseType": "DIRECT_CONTRACT"
  }'
```

Queue a parser result (maximum 1,000 per request):

```powershell
curl -X POST http://localhost:4001/v1/providers/hitmos/runs/RUN_ID/items `
  -H "content-type: application/json" `
  -H "x-api-key: dev-library-key" `
  -d '{
    "items": [
      {
        "providerItemId": "hitmos-track-123",
        "sourcePageUrl": "https://hitmos.me/example-track",
        "audioSourceUrl": "https://cdn.example.net/authorized-track.mp3",
        "title": "Track title",
        "artist": "Artist"
      }
    ]
  }'
```

When discovery is complete, seal the run:

```powershell
curl -X POST http://localhost:4001/v1/providers/hitmos/runs/RUN_ID/seal `
  -H "x-api-key: dev-library-key"
```

## Import a Licensed Track

```powershell
curl -X POST http://localhost:4001/v1/imports/url `
  -H "content-type: application/json" `
  -H "x-api-key: dev-library-key" `
  -d '{
    "sourceUrl": "https://example.com/public-domain/song.mp3",
    "title": "Example Song",
    "artist": "Example Artist",
    "license": {
      "type": "PUBLIC_DOMAIN",
      "proofUrl": "https://example.com/license",
      "rightsHolder": "Example Archive"
    }
  }'
```

## Import Many Links

Use `POST /v1/imports/urls` with a shared license:

```powershell
curl -X POST http://localhost:4001/v1/imports/urls `
  -H "content-type: application/json" `
  -H "x-api-key: dev-library-key" `
  -d '{
    "license": {
      "type": "OWNED",
      "proofUrl": "local-admin-import"
    },
    "items": [
      {
        "sourceUrl": "https://example.com/song-1.mp3",
        "title": "Song 1",
        "artist": "Artist"
      },
      {
        "sourceUrl": "https://example.com/song-2.mp3",
        "title": "Song 2",
        "artist": "Artist"
      }
    ]
  }'
```

Each item can also include its own `license` object if licenses differ.

## Play a Track

```powershell
curl -L http://localhost:4001/v1/tracks/TRACK_ID/stream `
  -H "x-api-key: dev-library-key" `
  --output track.mp3
```

In S3 mode the endpoint redirects to a short-lived signed MinIO/S3 URL. In
PostgreSQL mode it streams the bytes directly from the database.

## Main App Integration

The main service should treat this as the source of truth for the playable audio
library:

- Search tracks through `GET /v1/tracks?query=...`.
- Store the returned `track.id` in QueueBeat's `Track` table as an external ID
  when you connect the two systems.
- Request audio through `GET /v1/tracks/:id/stream` from the backend only. Do
  not expose the service API key in browsers.

## Recommended Production Shape

- Put the service behind a private network or API gateway.
- Use real S3/R2/Yandex Object Storage with lifecycle policies.
- Add a background worker for large imports and audio transcoding.
- Add a CDN for public playback, but sign URLs at the backend boundary.
- Keep license proof URLs/documents immutable for auditability.
- Add content moderation and DMCA/removal workflows before public scale.

## API

### `GET /health`

Returns service status.

### `GET /v1/system/status`

Returns UI-friendly diagnostics for the API process, PostgreSQL, and storage.
Does not require `x-api-key`, because it is meant to explain setup problems.

### `POST /v1/imports/url`

Creates an import job from a direct HTTP(S) audio URL. Requires `x-api-key`.

Required JSON fields:

- `sourceUrl`
- `license.type`
- `license.proofUrl`

Optional JSON fields:

- `title`
- `artist`
- `durationSec`
- `license.rightsHolder`
- `license.expiresAt`
- `license.territory`
- `license.notes`

### `GET /v1/imports/:id`

Returns import status. Requires `x-api-key`.

### `POST /v1/imports/urls`

Imports up to 50 links in one request. Requires `x-api-key`.

### `GET /v1/tracks`

Searches active tracks. Requires `x-api-key`.

Query parameters:

- `query`
- `artist`
- `limit`, max 100
- `cursor`

### `GET /v1/tracks/:id`

Returns track metadata and assets. Requires `x-api-key`.

### `GET /v1/tracks/:id/stream`

Returns a short-lived signed object URL for the best available asset. Requires
`x-api-key`.
