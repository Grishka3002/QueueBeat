import { PrismaClient, QueueItemStatus } from "@prisma/client";

const prisma = new PrismaClient();

const tracks: [string, string, number][] = [
  ["Blinding Lights", "The Weeknd", 200],
  ["Midnight City", "M83", 244],
  ["One More Time", "Daft Punk", 320],
  ["Levitating", "Dua Lipa", 203],
  ["Lose Control", "Teddy Swims", 211],
  ["Feel It Still", "Portugal. The Man", 163],
  ["Titanium", "David Guetta ft. Sia", 245],
  ["Flowers", "Miley Cyrus", 201],
  ["As It Was", "Harry Styles", 167],
  ["Starboy", "The Weeknd ft. Daft Punk", 230],
  ["Bad Guy", "Billie Eilish", 194],
  ["Can't Hold Us", "Macklemore & Ryan Lewis", 258],
  ["On The Floor", "Jennifer Lopez", 266],
  ["Freed From Desire", "Gala", 214],
  ["Adventure of a Lifetime", "Coldplay", 264],
  ["Calm Down", "Rema", 239],
  ["Physical", "Dua Lipa", 193],
  ["Levels", "Avicii", 227],
  ["Houdini", "Dua Lipa", 185],
  ["Dance The Night", "Dua Lipa", 176],
  ["Firestone", "Kygo", 273],
  ["Don't Start Now", "Dua Lipa", 183],
  ["Rather Be", "Clean Bandit", 227],
  ["Lean On", "Major Lazer", 176],
  ["Latch", "Disclosure ft. Sam Smith", 255],
  ["Summer", "Calvin Harris", 223],
  ["Sweet Dreams", "Eurythmics", 233],
  ["Rhythm Is A Dancer", "Snap!", 231]
];

const venues = [
  {
    name: "Velvet Room",
    slug: "velvet-room",
    requestPriceCents: 90000,
    isAcceptingRequests: true
  },
  {
    name: "Luna Rooftop",
    slug: "luna-rooftop",
    requestPriceCents: 120000,
    isAcceptingRequests: true
  },
  {
    name: "Noir Bar",
    slug: "noir-bar",
    requestPriceCents: 70000,
    isAcceptingRequests: false
  }
];

async function main() {
  await prisma.queueItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.venueTrack.deleteMany();
  await prisma.track.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: "admin@queuebeat.local",
      name: "QueueBeat Admin"
    }
  });

  await prisma.track.createMany({
    data: tracks.map(([title, artist, durationSec]) => ({
      title,
      artist,
      durationSec
    }))
  });

  const createdTracks = await prisma.track.findMany({
    orderBy: [{ artist: "asc" }, { title: "asc" }]
  });

  await prisma.venue.createMany({
    data: venues
  });

  const createdVenues = await prisma.venue.findMany({
    orderBy: { createdAt: "asc" }
  });

  await prisma.venueTrack.createMany({
    data: createdVenues.flatMap((venue, index) =>
      createdTracks.slice(index * 8, index * 8 + 12).map((track) => ({
        venueId: venue.id,
        trackId: track.id
      }))
    )
  });

  const firstVenue = createdVenues[0];
  if (!firstVenue) {
    throw new Error("Seed failed: no venues were created.");
  }

  const seededTracks = createdTracks.slice(0, 3);

  for (const [index, track] of seededTracks.entries()) {
    const order = await prisma.order.create({
      data: {
        venueId: firstVenue.id,
        trackId: track.id,
        amountCents: firstVenue.requestPriceCents,
        status: "PAID",
        paymentReference: `seed-${index + 1}`,
        paidAt: new Date(Date.now() - index * 60 * 60 * 1000)
      }
    });

    await prisma.queueItem.create({
      data: {
        venueId: firstVenue.id,
        trackId: track.id,
        orderId: order.id,
        status: index === 2 ? QueueItemStatus.PLAYED : QueueItemStatus.QUEUED,
        position: index + 1,
        playedAt: index === 2 ? new Date() : null
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
