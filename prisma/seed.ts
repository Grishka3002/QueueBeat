import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient, QueueItemStatus } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

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
    isAcceptingRequests: true,
    businessProfile: {
      businessType: "LLC" as const,
      legalName: "LLC Velvet Room",
      inn: "7701234567",
      kpp: "770101001",
      ogrn: "1234567890123",
      ogrnip: null,
      legalAddress: "Moscow, Tverskaya street, 10",
      actualAddress: "Moscow, Tverskaya street, 10",
      contactName: "Alex Velvet",
      contactPhone: "+7 900 111-22-33",
      contactEmail: "velvet-room@queuebeat.local"
    }
  },
  {
    name: "Luna Rooftop",
    slug: "luna-rooftop",
    requestPriceCents: 120000,
    isAcceptingRequests: true,
    businessProfile: {
      businessType: "INDIVIDUAL_ENTREPRENEUR" as const,
      legalName: "IP Luna Rooftop",
      inn: "250100000001",
      kpp: null,
      ogrn: null,
      ogrnip: "325250100000001",
      legalAddress: "Vladivostok, Svetlanskaya street, 20",
      actualAddress: "Vladivostok, Svetlanskaya street, 20",
      contactName: "Luna Owner",
      contactPhone: "+7 900 222-33-44",
      contactEmail: "luna-rooftop@queuebeat.local"
    }
  },
  {
    name: "Noir Bar",
    slug: "noir-bar",
    requestPriceCents: 70000,
    isAcceptingRequests: false,
    businessProfile: {
      businessType: "LLC" as const,
      legalName: "LLC Noir Bar",
      inn: "7801234567",
      kpp: "780101001",
      ogrn: "1234567890124",
      ogrnip: null,
      legalAddress: "Saint Petersburg, Rubinstein street, 5",
      actualAddress: "Saint Petersburg, Rubinstein street, 5",
      contactName: "Noir Manager",
      contactPhone: "+7 900 333-44-55",
      contactEmail: "noir-bar@queuebeat.local"
    }
  }
];

async function main() {
  await prisma.payout.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.queueItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.venueTrack.deleteMany();
  await prisma.playlistPresetTrack.deleteMany();
  await prisma.playlistPreset.deleteMany();
  await prisma.venueSubscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.track.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: "QueueBeat Pro",
      slug: "pro-monthly",
      priceCents: 299000,
      intervalMonths: 1
    }
  });

  await prisma.user.create({
    data: {
      email: "platform@queuebeat.local",
      name: "QueueBeat Platform",
      passwordHash: hashPassword("queuebeat-admin"),
      role: "PLATFORM_ADMIN"
    }
  });

  const venueOwners = await prisma.user.createManyAndReturn({
    data: venues.map((venue) => ({
      email: `${venue.slug}@queuebeat.local`,
      name: `${venue.name} Owner`,
      passwordHash: hashPassword("queuebeat-admin"),
      role: "VENUE_OWNER" as const
    }))
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
    data: venues.map((venue, index) => ({
      name: venue.name,
      slug: venue.slug,
      requestPriceCents: venue.requestPriceCents,
      isAcceptingRequests: venue.isAcceptingRequests,
      ownerId: venueOwners[index]?.id,
      verificationStatus: "VERIFIED"
    }))
  });

  const createdVenues = await prisma.venue.findMany({
    orderBy: { createdAt: "asc" }
  });

  await prisma.venueSubscription.createMany({
    data: createdVenues.map((venue) => ({
      venueId: venue.id,
      planId: plan.id,
      status: "ACTIVE",
      startsAt: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  });

  await prisma.businessProfile.createMany({
    data: createdVenues.map((venue, index) => ({
      venueId: venue.id,
      ...venues[index].businessProfile
    }))
  });

  await prisma.venueTrack.createMany({
    data: createdVenues.flatMap((venue, index) =>
      createdTracks.slice(index * 8, index * 8 + 12).map((track) => ({
        venueId: venue.id,
        trackId: track.id
      }))
    )
  });

  const presetDefinitions = [
    {
      name: "Lounge Warmup",
      slug: "lounge-warmup",
      description: "Soft pop, nu-disco and cocktail bar tracks for early evening.",
      trackTitles: ["Midnight City", "Feel It Still", "Rather Be", "Latch", "Firestone", "Calm Down"]
    },
    {
      name: "Night Club Hits",
      slug: "night-club-hits",
      description: "Danceable crowd-pleasers for peak hours.",
      trackTitles: ["One More Time", "Titanium", "Levels", "Freed From Desire", "Summer", "Dance The Night"]
    },
    {
      name: "Pop Requests",
      slug: "pop-requests",
      description: "Recognizable pop tracks guests are likely to request first.",
      trackTitles: ["Blinding Lights", "Levitating", "Flowers", "As It Was", "Starboy", "Houdini"]
    }
  ];

  for (const presetDefinition of presetDefinitions) {
    const preset = await prisma.playlistPreset.create({
      data: {
        name: presetDefinition.name,
        slug: presetDefinition.slug,
        description: presetDefinition.description
      }
    });

    const presetTracks = createdTracks.filter((track) => presetDefinition.trackTitles.includes(track.title));
    await prisma.playlistPresetTrack.createMany({
      data: presetTracks.map((track, index) => ({
        presetId: preset.id,
        trackId: track.id,
        position: index + 1
      }))
    });
  }

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

    await prisma.payment.create({
      data: {
        venueId: firstVenue.id,
        orderId: order.id,
        kind: "TRACK_REQUEST",
        status: "SUCCEEDED",
        amountCents: firstVenue.requestPriceCents,
        provider: "mock",
        providerRef: `seed-payment-${index + 1}`,
        paidAt: order.paidAt
      }
    });

    const platformFeeCents = Math.round((firstVenue.requestPriceCents * firstVenue.platformFeeBps) / 10000);
    await prisma.ledgerEntry.createMany({
      data: [
        {
          venueId: firstVenue.id,
          orderId: order.id,
          type: "VENUE_SHARE",
          amountCents: firstVenue.requestPriceCents - platformFeeCents,
          description: "Seed venue share for paid track request"
        },
        {
          venueId: firstVenue.id,
          orderId: order.id,
          type: "PLATFORM_FEE",
          amountCents: -platformFeeCents,
          description: "Seed QueueBeat platform fee"
        }
      ]
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
