import { QueueItemStatus } from "@prisma/client";

type DemoTrack = {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  coverUrl: string | null;
};

type DemoVenue = {
  id: string;
  name: string;
  slug: string;
  requestPriceCents: number;
  isAcceptingRequests: boolean;
  allowedTrackIds: string[];
};

type DemoOrder = {
  id: string;
  venueId: string;
  trackId: string;
  amountCents: number;
  status: "PENDING" | "PAID" | "FAILED";
  paymentReference: string | null;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
};

type DemoQueueItem = {
  id: string;
  venueId: string;
  trackId: string;
  orderId: string;
  status: QueueItemStatus;
  position: number;
  createdAt: Date;
  playedAt: Date | null;
  removedAt: Date | null;
};

type DemoStore = {
  venues: DemoVenue[];
  tracks: DemoTrack[];
  orders: DemoOrder[];
  queueItems: DemoQueueItem[];
};

const initialTracksSource: [string, string, string, number][] = [
  ["track-01", "Blinding Lights", "The Weeknd", 200],
  ["track-02", "Midnight City", "M83", 244],
  ["track-03", "One More Time", "Daft Punk", 320],
  ["track-04", "Levitating", "Dua Lipa", 203],
  ["track-05", "Lose Control", "Teddy Swims", 211],
  ["track-06", "Feel It Still", "Portugal. The Man", 163],
  ["track-07", "Titanium", "David Guetta ft. Sia", 245],
  ["track-08", "Flowers", "Miley Cyrus", 201],
  ["track-09", "As It Was", "Harry Styles", 167],
  ["track-10", "Starboy", "The Weeknd ft. Daft Punk", 230],
  ["track-11", "Bad Guy", "Billie Eilish", 194],
  ["track-12", "Can’t Hold Us", "Macklemore & Ryan Lewis", 258],
  ["track-13", "On The Floor", "Jennifer Lopez", 266],
  ["track-14", "Freed From Desire", "Gala", 214],
  ["track-15", "Adventure of a Lifetime", "Coldplay", 264],
  ["track-16", "Calm Down", "Rema", 239],
  ["track-17", "Physical", "Dua Lipa", 193],
  ["track-18", "Levels", "Avicii", 227],
  ["track-19", "Houdini", "Dua Lipa", 185],
  ["track-20", "Dance The Night", "Dua Lipa", 176]
];

const initialTracks: DemoTrack[] = initialTracksSource.map(([id, title, artist, durationSec]) => ({
  id,
  title,
  artist,
  durationSec,
  coverUrl: null
}));

const initialVenues: DemoVenue[] = [
  {
    id: "venue-01",
    name: "Velvet Room",
    slug: "velvet-room",
    requestPriceCents: 90000,
    isAcceptingRequests: true,
    allowedTrackIds: initialTracks.slice(0, 10).map((track) => track.id)
  },
  {
    id: "venue-02",
    name: "Luna Rooftop",
    slug: "luna-rooftop",
    requestPriceCents: 120000,
    isAcceptingRequests: true,
    allowedTrackIds: initialTracks.slice(5, 16).map((track) => track.id)
  },
  {
    id: "venue-03",
    name: "Noir Bar",
    slug: "noir-bar",
    requestPriceCents: 70000,
    isAcceptingRequests: false,
    allowedTrackIds: initialTracks.slice(10, 20).map((track) => track.id)
  }
];

const initialOrders: DemoOrder[] = [
  {
    id: "order-seed-01",
    venueId: "venue-01",
    trackId: "track-01",
    amountCents: 90000,
    status: "PAID",
    paymentReference: "seed-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
  },
  {
    id: "order-seed-02",
    venueId: "venue-01",
    trackId: "track-02",
    amountCents: 90000,
    status: "PAID",
    paymentReference: "seed-2",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  {
    id: "order-seed-03",
    venueId: "venue-01",
    trackId: "track-03",
    amountCents: 90000,
    status: "PAID",
    paymentReference: "seed-3",
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60),
    paidAt: new Date(Date.now() - 1000 * 60 * 60)
  }
];

const initialQueueItems: DemoQueueItem[] = [
  {
    id: "queue-seed-01",
    venueId: "venue-01",
    trackId: "track-01",
    orderId: "order-seed-01",
    status: QueueItemStatus.QUEUED,
    position: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    playedAt: null,
    removedAt: null
  },
  {
    id: "queue-seed-02",
    venueId: "venue-01",
    trackId: "track-02",
    orderId: "order-seed-02",
    status: QueueItemStatus.QUEUED,
    position: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    playedAt: null,
    removedAt: null
  },
  {
    id: "queue-seed-03",
    venueId: "venue-01",
    trackId: "track-03",
    orderId: "order-seed-03",
    status: QueueItemStatus.PLAYED,
    position: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    playedAt: new Date(Date.now() - 1000 * 30),
    removedAt: null
  }
];

const globalForDemo = globalThis as unknown as { queueBeatDemoStore?: DemoStore };

function cloneStore(): DemoStore {
  return {
    venues: structuredClone(initialVenues),
    tracks: structuredClone(initialTracks),
    orders: structuredClone(initialOrders),
    queueItems: structuredClone(initialQueueItems)
  };
}

function getStore() {
  if (!globalForDemo.queueBeatDemoStore) {
    globalForDemo.queueBeatDemoStore = cloneStore();
  }

  return globalForDemo.queueBeatDemoStore;
}

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDemoVenueBySlug(slug: string) {
  const store = getStore();
  const venue = store.venues.find((item) => item.slug === slug);
  if (!venue) {
    return null;
  }

  return {
    ...venue,
    venueTracks: venue.allowedTrackIds
      .map((trackId) => store.tracks.find((track) => track.id === trackId))
      .filter((track): track is DemoTrack => Boolean(track))
      .sort((left, right) => left.title.localeCompare(right.title))
      .map((track) => ({
        track
      })),
    queueItems: store.queueItems
      .filter((item) => item.venueId === venue.id && item.status === QueueItemStatus.QUEUED)
      .sort((left, right) => left.position - right.position)
      .slice(0, 8)
      .map((item) => ({
        ...item,
        track: store.tracks.find((track) => track.id === item.trackId)!
      }))
  };
}

export function getDemoDashboard() {
  const store = getStore();
  return {
    venues: store.venues.map((venue) => ({
      ...venue,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        venueTracks: venue.allowedTrackIds.length,
        queueItems: store.queueItems.filter((item) => item.venueId === venue.id).length,
        orders: store.orders.filter((order) => order.venueId === venue.id).length
      }
    })),
    tracksCount: store.tracks.length,
    ordersCount: store.orders.filter((order) => order.status === "PAID").length
  };
}

export function getDemoVenueById(venueId: string) {
  const store = getStore();
  const venue = store.venues.find((item) => item.id === venueId);
  if (!venue) {
    return null;
  }

  return {
    venue: {
      ...venue,
      createdAt: new Date(),
      updatedAt: new Date(),
      venueTracks: venue.allowedTrackIds
        .map((trackId) => store.tracks.find((track) => track.id === trackId))
        .filter((track): track is DemoTrack => Boolean(track))
        .sort((left, right) => left.title.localeCompare(right.title))
        .map((track) => ({
          id: `${venue.id}-${track.id}`,
          venueId: venue.id,
          trackId: track.id,
          createdAt: new Date(),
          track
        })),
      queueItems: store.queueItems
        .filter((item) => item.venueId === venue.id)
        .sort((left, right) => left.position - right.position)
        .map((item) => ({
          ...item,
          track: store.tracks.find((track) => track.id === item.trackId)!,
          order: store.orders.find((order) => order.id === item.orderId)!
        }))
    },
    allTracks: structuredClone(store.tracks)
  };
}

export function createDemoPendingOrder(venueId: string, trackId: string) {
  const store = getStore();
  const venue = store.venues.find((item) => item.id === venueId);
  if (!venue) {
    return { error: "Venue not found." as const };
  }
  if (!venue.isAcceptingRequests) {
    return { error: "Venue is not accepting requests." as const };
  }
  if (!venue.allowedTrackIds.includes(trackId)) {
    return { error: "This track is not allowed for the selected venue." as const };
  }

  const order: DemoOrder = {
    id: randomId("order"),
    venueId,
    trackId,
    amountCents: venue.requestPriceCents,
    status: "PENDING",
    paymentReference: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    paidAt: null
  };

  store.orders.push(order);
  return { order, venue };
}

export function setDemoOrderPaymentReference(orderId: string, paymentReference: string) {
  const store = getStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) {
    return null;
  }

  order.paymentReference = paymentReference;
  order.updatedAt = new Date();
  return order;
}

export function confirmDemoOrder(orderId: string) {
  const store = getStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) {
    return { error: "Order not found." as const };
  }
  if (order.status !== "PENDING") {
    return { error: "Order is not pending." as const };
  }

  const venue = store.venues.find((item) => item.id === order.venueId);
  if (!venue || !venue.allowedTrackIds.includes(order.trackId)) {
    return { error: "Track is no longer available for this venue." as const };
  }

  order.status = "PAID";
  order.paidAt = new Date();
  order.updatedAt = new Date();

  const nextPosition =
    Math.max(
      0,
      ...store.queueItems
        .filter((item) => item.venueId === order.venueId && item.status === QueueItemStatus.QUEUED)
        .map((item) => item.position)
    ) + 1;

  store.queueItems.push({
    id: randomId("queue"),
    venueId: order.venueId,
    trackId: order.trackId,
    orderId: order.id,
    status: QueueItemStatus.QUEUED,
    position: nextPosition,
    createdAt: new Date(),
    playedAt: null,
    removedAt: null
  });

  return { order };
}

export function updateDemoVenueSettings(
  venueId: string,
  payload: Pick<DemoVenue, "name" | "slug" | "requestPriceCents" | "isAcceptingRequests">
) {
  const store = getStore();
  const venue = store.venues.find((item) => item.id === venueId);
  if (!venue) {
    return { error: "Venue not found." as const };
  }

  const slugTaken = store.venues.some((item) => item.id !== venueId && item.slug === payload.slug);
  if (slugTaken) {
    return { error: "Slug already exists." as const };
  }

  venue.name = payload.name;
  venue.slug = payload.slug;
  venue.requestPriceCents = payload.requestPriceCents;
  venue.isAcceptingRequests = payload.isAcceptingRequests;

  return { venue };
}

export function replaceDemoVenueTracks(venueId: string, trackIds: string[]) {
  const store = getStore();
  const venue = store.venues.find((item) => item.id === venueId);
  if (!venue) {
    return { error: "Venue not found." as const };
  }

  const allExist = trackIds.every((trackId) => store.tracks.some((track) => track.id === trackId));
  if (!allExist) {
    return { error: "Some tracks do not exist." as const };
  }

  venue.allowedTrackIds = [...trackIds];
  return { venue };
}

export function updateDemoQueueItem(
  venueId: string,
  queueItemId: string,
  status: "PLAYED" | "REMOVED"
) {
  const store = getStore();
  const queueItem = store.queueItems.find((item) => item.id === queueItemId && item.venueId === venueId);
  if (!queueItem) {
    return { error: "Queue item not found." as const };
  }

  queueItem.status = status;
  queueItem.playedAt = status === QueueItemStatus.PLAYED ? new Date() : null;
  queueItem.removedAt = status === QueueItemStatus.REMOVED ? new Date() : null;
  return { queueItem };
}

export function getDemoTracks() {
  return structuredClone(getStore().tracks);
}
