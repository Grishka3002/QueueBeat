-- Use VENUE_OWNER as the default only after the enum value has been committed.
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VENUE_OWNER';
