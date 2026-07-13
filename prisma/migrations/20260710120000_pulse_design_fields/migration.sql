-- Поля дизайна «Пульс»: адрес и брендинг заведения, жанр трека, фоновый режим плеера.
ALTER TABLE "Venue" ADD COLUMN "address" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Venue" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Venue" ADD COLUMN "accentColor" TEXT NOT NULL DEFAULT '#F849A6';
ALTER TABLE "Venue" ADD COLUMN "backgroundMode" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Venue" ADD COLUMN "tariff" TEXT NOT NULL DEFAULT 'start';

ALTER TABLE "Track" ADD COLUMN "genre" TEXT NOT NULL DEFAULT 'pop';
