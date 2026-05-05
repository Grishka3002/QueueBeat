# QueueBeat

QueueBeat is an MVP for QR-based music requests in venues. Guests open a public venue page, choose an allowed track, complete a mock payment, and the paid request is added to that venue's queue.

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
- `http://localhost:3000/v/velvet-room`
- `http://localhost:3000/admin/login`

Default local admin password:

```text
queuebeat-admin
```

## Database

For a real PostgreSQL database, set:

```env
DATABASE_URL="postgresql://..."
DEMO_MODE="false"
ADMIN_PASSWORD="a-strong-password"
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

## Railway

Recommended environment variables:

```env
DATABASE_URL="railway-postgres-url"
NEXT_PUBLIC_APP_URL="https://your-app.up.railway.app"
ADMIN_PASSWORD="strong-admin-password"
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
- Admin auth is password-cookie based and should be replaced with real auth before a public launch.
- Demo mode is intentionally isolated from production paths.
- Queue positions are protected by a per-venue unique constraint and serializable payment finalization.
