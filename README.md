# Трекни (QueueBeat)

Трекни is an MVP for QR-based music requests in venues, built with the «Пульс» design system (see `design/Trekni — сервис заказа музыки/design`). Guests open a public venue page, choose an allowed track, complete a mock SBP-style payment, and the paid request is added to that venue's queue. A venue player screen plays requests first and falls back to an endless background playlist; a mobile remote controls it from the owner cabinet.

Key routes:

- `/` — landing for venues (тарифы, калькулятор дохода, FAQ, регистрация)
- `/v/[slug]` — guest flow (RU/EN, поиск, жанры, шит оплаты СБП, очередь)
- `/player/[venueId]` — 16:9 player screen for venue speakers (demo mode)
- `/admin/venues/[venueId]/remote` — mobile shift remote (play/pause, skip, volume, queue)

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL

## Local Setup

Install dependencies:

```powershell
npm install
```

Use Node.js 22.x. The project includes `.nvmrc` and `package.json` engines for that version.

Run in demo mode without PostgreSQL:

```powershell
copy .env.example .env
```

Set this in `.env`:

```env
DEMO_MODE="true"
```

Then start:

```powershell
npm run dev
```

If the Windows SWC binary fails on your machine, use the included local helper scripts:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-demo-dev.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\build-local.ps1
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/register`
- `http://localhost:3000/login`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/platform/login`
- `http://localhost:3000/platform`
- `http://localhost:3000/v/velvet-room`

## Personal Party Mode

For a private, non-commercial version for friends, enable:

```env
PERSONAL_MODE="true"
```

In this mode the guest QR page keeps the music library and live queue, but skips
subscriptions, mock payment, commissions, and payout ledger entries. Friends pick
a track and it goes straight into the party queue.

Default local platform password and seeded venue-owner password:

```text
queuebeat-admin
```

Seeded venue-owner emails use the venue slug, for example:

```text
velvet-room@queuebeat.local
```

## Database

For a real PostgreSQL database, set:

```env
DATABASE_URL="postgresql://..."
DEMO_MODE="false"
ADMIN_PASSWORD="a-strong-password"
AUTH_SECRET="a-long-random-secret"
NEXT_PUBLIC_APP_URL="https://your-app.up.railway.app"
```

Generate Prisma client:

```powershell
npx prisma generate
```

Run migrations:

```powershell
npx prisma migrate deploy
npx prisma db seed
```

During local schema development, create a new migration with:

```powershell
npx prisma migrate dev --name your_change_name
```

For quick throwaway MVP databases only, you can still push the schema directly:

```powershell
npx prisma db push
```

## Music Library Connection

The authorized audio library runs separately from QueueBeat. Add its private
server address and API key to the main app's `.env.local`:

```env
MUSIC_LIBRARY_URL="http://localhost:4001"
MUSIC_LIBRARY_API_KEY="dev-library-key"
```

Run the migration after pulling these changes:

```powershell
npm run prisma:deploy
```

Start `music-library-service` on port `4001`, then open an admin venue's
settings and select **Обновить из медиатеки**. New licensed tracks appear in
the existing catalog selector; choose the tracks for that venue and save the
selection. The API key is used only by the QueueBeat server.

For a real local connection, first create the main app database with the same
PostgreSQL admin password used for the music library:

```powershell
powershell -ExecutionPolicy Bypass -File .\music-library-service\scripts\create-local-postgres-db.ps1 `
  -AppUser queuebeat -AppPassword queuebeat -Database queuebeat
```

Then add these lines to `.env.local`, run `npm run prisma:deploy`, and restart
the main app:

```env
DATABASE_URL="postgresql://queuebeat:queuebeat@localhost:5432/queuebeat?schema=public"
DEMO_MODE="false"
```

## Railway

Recommended environment variables:

```env
DATABASE_URL="railway-postgres-url"
NEXT_PUBLIC_APP_URL="https://your-app.up.railway.app"
ADMIN_PASSWORD="strong-admin-password"
AUTH_SECRET="long-random-auth-secret"
DEMO_MODE="false"
```

Build command:

```text
npm run railway:build
```

Start command:

```text
npm run start
```

## Checks

```powershell
npm run lint
npm run typecheck
npm run build
npx prisma validate
```

On this Windows machine, `npm run build` may fail because the native Next SWC binary cannot be loaded. Use `scripts/build-local.ps1` for local verification; Railway/Linux should use the normal `npm run railway:build`.

## MVP Notes

- Payment is currently a mock provider behind a small provider interface.
- Platform owner auth is still password-cookie based.
- Venue accounts use email/password cookies and should move to full production auth before a public launch.
- Demo mode is intentionally isolated from production paths.
- Queue positions are protected by a per-venue unique constraint and serializable payment finalization.
