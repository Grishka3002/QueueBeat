-- Links QueueBeat catalog entries to the authorized audio library service.
ALTER TABLE "Track" ADD COLUMN "libraryTrackId" TEXT;
ALTER TABLE "Track" ADD COLUMN "librarySyncedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Track_libraryTrackId_key" ON "Track"("libraryTrackId");
