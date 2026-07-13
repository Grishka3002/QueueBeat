import { QueueItemStatus } from "@prisma/client";

export type TrackGenre = "pop" | "rock" | "hip" | "y2k" | "club";

export type VenueTariff = "start" | "legal" | "all";

type DemoTrack = {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  coverUrl: string | null;
  genre: TrackGenre;
};

type DemoVenue = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  accentColor: string;
  tariff: VenueTariff;
  requestPriceCents: number;
  isAcceptingRequests: boolean;
  backgroundMode: boolean;
  allowedTrackIds: string[];
};

export type DemoOwner = {
  id: string;
  name: string;
  email: string;
  password: string;
  venueIds: string[];
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

type DemoPlaybackLogEntry = {
  id: string;
  venueId: string;
  trackId: string;
  source: "request" | "background";
  startedAt: Date;
  durationSec: number;
};

type DemoPlayerState = {
  venueId: string;
  currentTrackId: string | null;
  currentSource: "request" | "background";
  currentQueueItemId: string | null;
  positionSec: number;
  lastTickAt: number;
  playing: boolean;
  volume: number;
  muted: boolean;
  bgIdx: number;
  playedRequestsTonight: number;
};

type DemoStore = {
  venues: DemoVenue[];
  tracks: DemoTrack[];
  orders: DemoOrder[];
  queueItems: DemoQueueItem[];
  players: Record<string, DemoPlayerState>;
  playbackLog: DemoPlaybackLogEntry[];
};

const initialTracksSource: [string, string, string, number, TrackGenre][] = [
  ["track-01", "Life", "Zivert", 187, "pop"],
  ["track-02", "Положение", "Скриптонит", 224, "hip"],
  ["track-03", "Blinding Lights", "The Weeknd", 200, "pop"],
  ["track-04", "Крошка моя", "Руки Вверх", 221, "y2k"],
  ["track-05", "Don't Stop Me Now", "Queen", 209, "rock"],
  ["track-06", "Компромисс", "Би-2", 250, "rock"],
  ["track-07", "I Got Love", "Miyagi & Эндшпиль", 256, "hip"],
  ["track-08", "Утекай", "Мумий Тролль", 228, "rock"],
  ["track-09", "Невеста", "Глюк'oZa", 202, "y2k"],
  ["track-10", "Dancing Queen", "ABBA", 230, "pop"],
  ["track-11", "Плачу на техно", "Cream Soda", 192, "pop"],
  ["track-12", "Небо", "Дискотека Авария", 235, "y2k"],
  ["track-13", "Billie Jean", "Michael Jackson", 294, "pop"],
  ["track-14", "Полковнику никто не пишет", "Би-2", 257, "rock"],
  ["track-15", "Midnight City", "M83", 244, "pop"],
  ["track-16", "Levitating", "Dua Lipa", 203, "pop"],
  ["track-17", "Freed From Desire", "Gala", 214, "y2k"],
  ["track-18", "Levels", "Avicii", 227, "pop"],
  ["track-19", "Хардбас 2007", "DJ Кислотный", 178, "club"],
  ["track-20", "As It Was", "Harry Styles", 167, "pop"]
];

const initialTracks: DemoTrack[] = initialTracksSource.map(
  ([id, title, artist, durationSec, genre]) => ({
    id,
    title,
    artist,
    durationSec,
    coverUrl: null,
    genre
  })
);

const initialVenues: DemoVenue[] = [
  {
    id: "venue-01",
    name: "Бар «Соловей»",
    slug: "velvet-room",
    address: "Никольская, 12",
    city: "Москва",
    accentColor: "#F849A6",
    tariff: "legal",
    requestPriceCents: 19900,
    isAcceptingRequests: true,
    backgroundMode: true,
    allowedTrackIds: initialTracks.slice(0, 14).map((track) => track.id)
  },
  {
    id: "venue-02",
    name: "Клуб «Резонанс»",
    slug: "luna-rooftop",
    address: "Невский, 88",
    city: "Санкт-Петербург",
    accentColor: "#3BD6EA",
    tariff: "all",
    requestPriceCents: 29900,
    isAcceptingRequests: true,
    backgroundMode: true,
    allowedTrackIds: initialTracks.slice(5, 18).map((track) => track.id)
  },
  {
    id: "venue-03",
    name: "Лаунж «Вельвет»",
    slug: "noir-bar",
    address: "Курортный пр., 5",
    city: "Сочи",
    accentColor: "#9D6BFF",
    tariff: "start",
    requestPriceCents: 14900,
    isAcceptingRequests: false,
    backgroundMode: true,
    allowedTrackIds: initialTracks.slice(8, 20).map((track) => track.id)
  }
];

const initialOrders: DemoOrder[] = [
  {
    id: "order-seed-01",
    venueId: "venue-01",
    trackId: "track-01",
    amountCents: 19900,
    status: "PAID",
    paymentReference: "seed-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
  },
  {
    id: "order-seed-02",
    venueId: "venue-01",
    trackId: "track-04",
    amountCents: 19900,
    status: "PAID",
    paymentReference: "seed-2",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  {
    id: "order-seed-03",
    venueId: "venue-01",
    trackId: "track-13",
    amountCents: 19900,
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
    trackId: "track-04",
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
    trackId: "track-13",
    orderId: "order-seed-03",
    status: QueueItemStatus.QUEUED,
    position: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    playedAt: null,
    removedAt: null
  }
];

// Демо-аккаунты владельцев: email = <slug>@queuebeat.local, пароль общий демо-пароль.
const DEMO_OWNERS: DemoOwner[] = [
  {
    id: "owner-01",
    name: "Алина Ковалёва",
    email: "velvet-room@queuebeat.local",
    password: "queuebeat-admin",
    venueIds: ["venue-01"]
  },
  {
    id: "owner-02",
    name: "Марина Соколова",
    email: "luna-rooftop@queuebeat.local",
    password: "queuebeat-admin",
    venueIds: ["venue-02"]
  },
  {
    id: "owner-03",
    name: "Рустам Азизов",
    email: "noir-bar@queuebeat.local",
    password: "queuebeat-admin",
    venueIds: ["venue-03"]
  }
];

export function findDemoOwnerByCredentials(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return (
    DEMO_OWNERS.find(
      (owner) => owner.email.toLowerCase() === normalized && owner.password === password
    ) ?? null
  );
}

export function getDemoOwnerById(ownerId: string) {
  return DEMO_OWNERS.find((owner) => owner.id === ownerId) ?? null;
}

export function getDemoOwnerForVenue(venueId: string) {
  return DEMO_OWNERS.find((owner) => owner.venueIds.includes(venueId)) ?? null;
}

const globalForDemo = globalThis as unknown as { queueBeatDemoStore?: DemoStore };

function cloneStore(): DemoStore {
  return {
    venues: structuredClone(initialVenues),
    tracks: structuredClone(initialTracks),
    orders: structuredClone(initialOrders),
    queueItems: structuredClone(initialQueueItems),
    players: {},
    playbackLog: []
  };
}

function getStore() {
  if (!globalForDemo.queueBeatDemoStore) {
    globalForDemo.queueBeatDemoStore = cloneStore();
  }

  const store = globalForDemo.queueBeatDemoStore;
  // хранилище могло быть создано старой версией кода без этих коллекций
  store.players = store.players ?? {};
  store.playbackLog = store.playbackLog ?? [];
  return store;
}

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getDemoSubscriptions(venue: DemoVenue) {
  if (venue.slug === "noir-bar") {
    return [];
  }

  return [
    {
      id: `demo-sub-${venue.id}`,
      status: "ACTIVE" as const,
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  ];
}

export function getDemoVenueBySlug(slug: string) {
  const store = getStore();
  const venue = store.venues.find((item) => item.slug === slug);
  if (!venue) {
    return null;
  }

  return {
    ...venue,
    subscriptions: getDemoSubscriptions(venue),
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
      subscriptions: getDemoSubscriptions(venue),
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
    return { error: "Заведение не найдено." as const };
  }
  if (!venue.isAcceptingRequests) {
    return { error: "Заведение сейчас не принимает заявки." as const };
  }
  if (!venue.allowedTrackIds.includes(trackId)) {
    return { error: "Этот трек не разрешён для выбранного заведения." as const };
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
    return { error: "Заказ не найден." as const };
  }
  if (order.status !== "PENDING") {
    return { error: "Заказ уже не ожидает оплату." as const };
  }

  const venue = store.venues.find((item) => item.id === order.venueId);
  if (!venue || !venue.allowedTrackIds.includes(order.trackId)) {
    return { error: "Трек больше недоступен для этого заведения." as const };
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

export function createDemoPersonalQueueRequest(venueId: string, trackId: string) {
  const store = getStore();
  const venue = store.venues.find((item) => item.id === venueId);
  if (!venue) {
    return { error: "Заведение не найдено." as const };
  }
  if (!venue.isAcceptingRequests) {
    return { error: "Плейлист сейчас не принимает заявки." as const };
  }
  if (!venue.allowedTrackIds.includes(trackId)) {
    return { error: "Этот трек недоступен для выбранного плейлиста." as const };
  }

  const order: DemoOrder = {
    id: randomId("order"),
    venueId,
    trackId,
    amountCents: 0,
    status: "PAID",
    paymentReference: "personal-mode",
    createdAt: new Date(),
    updatedAt: new Date(),
    paidAt: new Date()
  };

  const nextPosition =
    Math.max(
      0,
      ...store.queueItems
        .filter((item) => item.venueId === venueId)
        .map((item) => item.position)
    ) + 1;

  store.orders.push(order);
  store.queueItems.push({
    id: randomId("queue"),
    venueId,
    trackId,
    orderId: order.id,
    status: QueueItemStatus.QUEUED,
    position: nextPosition,
    createdAt: new Date(),
    playedAt: null,
    removedAt: null
  });

  return { order, venue };
}

export function updateDemoVenueSettings(
  venueId: string,
  payload: Pick<DemoVenue, "name" | "slug" | "requestPriceCents" | "isAcceptingRequests">
) {
  const store = getStore();
  const venue = store.venues.find((item) => item.id === venueId);
  if (!venue) {
    return { error: "Заведение не найдено." as const };
  }

  const slugTaken = store.venues.some((item) => item.id !== venueId && item.slug === payload.slug);
  if (slugTaken) {
    return { error: "Этот slug уже занят." as const };
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
    return { error: "Заведение не найдено." as const };
  }

  const allExist = trackIds.every((trackId) => store.tracks.some((track) => track.id === trackId));
  if (!allExist) {
    return { error: "Некоторые треки не существуют." as const };
  }

  venue.allowedTrackIds = [...trackIds];
  return { venue };
}

export function addDemoCustomTrack(
  venueId: string,
  payload: Pick<DemoTrack, "title" | "artist" | "durationSec" | "coverUrl"> & {
    genre?: TrackGenre;
  }
) {
  const store = getStore();
  const venue = store.venues.find((item) => item.id === venueId);
  if (!venue) {
    return { error: "Заведение не найдено." as const };
  }

  const track: DemoTrack = {
    id: randomId("track"),
    genre: payload.genre ?? "pop",
    ...payload
  };

  store.tracks.push(track);
  venue.allowedTrackIds.push(track.id);
  return { track };
}

export function updateDemoQueueItem(
  venueId: string,
  queueItemId: string,
  status: "PLAYED" | "REMOVED"
) {
  const store = getStore();
  const queueItem = store.queueItems.find((item) => item.id === queueItemId && item.venueId === venueId);
  if (!queueItem) {
    return { error: "Элемент очереди не найден." as const };
  }

  queueItem.status = status;
  queueItem.playedAt = status === QueueItemStatus.PLAYED ? new Date() : null;
  queueItem.removedAt = status === QueueItemStatus.REMOVED ? new Date() : null;
  return { queueItem };
}

export function getDemoTracks() {
  return structuredClone(getStore().tracks);
}

/* ═══════════════════════════════════════════════════════════════════
   Плеер заведения: заявки играют первыми, затем бесконечный фон.
   Состояние продвигается лениво по настенным часам при каждом чтении,
   поэтому фоновых таймеров на сервере не требуется.
   ═══════════════════════════════════════════════════════════════════ */

function backgroundOrder(venue: DemoVenue) {
  // детерминированный «случайный» порядок: перемешиваем по хэшу id
  const ids = [...venue.allowedTrackIds];
  ids.sort((a, b) => {
    const ha = (a + venue.id).split("").reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9973, 7);
    const hb = (b + venue.id).split("").reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9973, 7);
    return ha - hb;
  });
  return ids;
}

function trackById(store: DemoStore, trackId: string | null) {
  return store.tracks.find((track) => track.id === trackId) ?? null;
}

function nextQueuedItem(store: DemoStore, venueId: string) {
  return (
    store.queueItems
      .filter((item) => item.venueId === venueId && item.status === QueueItemStatus.QUEUED)
      .sort((left, right) => left.position - right.position)[0] ?? null
  );
}

function startNextTrack(store: DemoStore, venue: DemoVenue, state: DemoPlayerState) {
  const queued = nextQueuedItem(store, venue.id);
  if (queued) {
    queued.status = QueueItemStatus.PLAYED;
    queued.playedAt = new Date();
    state.currentTrackId = queued.trackId;
    state.currentSource = "request";
    state.currentQueueItemId = queued.id;
    state.playedRequestsTonight += 1;
    return;
  }

  const order = backgroundOrder(venue);
  if (order.length === 0 || !venue.backgroundMode) {
    state.currentTrackId = null;
    state.currentQueueItemId = null;
    state.currentSource = "background";
    return;
  }

  state.currentTrackId = order[state.bgIdx % order.length];
  state.bgIdx += 1;
  state.currentSource = "background";
  state.currentQueueItemId = null;
}

function logPlayback(store: DemoStore, state: DemoPlayerState, durationSec: number) {
  if (!state.currentTrackId) {
    return;
  }

  store.playbackLog.unshift({
    id: randomId("log"),
    venueId: state.venueId,
    trackId: state.currentTrackId,
    source: state.currentSource,
    startedAt: new Date(Date.now() - durationSec * 1000),
    durationSec
  });
  store.playbackLog = store.playbackLog.slice(0, 500);
}

function ensurePlayer(store: DemoStore, venue: DemoVenue): DemoPlayerState {
  let state = store.players[venue.id];
  if (!state) {
    state = {
      venueId: venue.id,
      currentTrackId: null,
      currentSource: "background",
      currentQueueItemId: null,
      positionSec: 0,
      lastTickAt: Date.now(),
      playing: true,
      volume: 65,
      muted: false,
      bgIdx: 0,
      playedRequestsTonight: 0
    };
    startNextTrack(store, venue, state);
    store.players[venue.id] = state;
  }

  return state;
}

function advancePlayer(store: DemoStore, venue: DemoVenue) {
  const state = ensurePlayer(store, venue);
  const now = Date.now();

  if (!state.playing) {
    state.lastTickAt = now;
    return state;
  }

  state.positionSec += (now - state.lastTickAt) / 1000;
  state.lastTickAt = now;

  // защита от вечного цикла на пустом плейлисте
  for (let hops = 0; hops < 50; hops += 1) {
    const current = trackById(store, state.currentTrackId);
    if (!current) {
      startNextTrack(store, venue, state);
      if (!state.currentTrackId) {
        state.positionSec = 0;
        return state;
      }
      continue;
    }

    if (state.positionSec < current.durationSec) {
      return state;
    }

    logPlayback(store, state, current.durationSec);
    state.positionSec -= current.durationSec;
    startNextTrack(store, venue, state);
    if (!state.currentTrackId) {
      state.positionSec = 0;
      return state;
    }
  }

  return state;
}

export type DemoPlayerSnapshot = {
  venue: {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    accentColor: string;
    requestPriceCents: number;
    isAcceptingRequests: boolean;
    backgroundMode: boolean;
  };
  playing: boolean;
  volume: number;
  muted: boolean;
  playedRequestsTonight: number;
  nowPlaying: {
    trackId: string;
    title: string;
    artist: string;
    durationSec: number;
    elapsedSec: number;
    source: "request" | "background";
  } | null;
  queue: {
    id: string;
    orderId: string;
    trackId: string;
    title: string;
    artist: string;
    durationSec: number;
    position: number;
  }[];
};

export function getDemoPlayerSnapshot(venueId: string): DemoPlayerSnapshot | null {
  const store = getStore();
  const venue = store.venues.find((item) => item.id === venueId);
  if (!venue) {
    return null;
  }

  const state = advancePlayer(store, venue);
  const current = trackById(store, state.currentTrackId);

  return {
    venue: {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      address: venue.address,
      city: venue.city,
      accentColor: venue.accentColor,
      requestPriceCents: venue.requestPriceCents,
      isAcceptingRequests: venue.isAcceptingRequests,
      backgroundMode: venue.backgroundMode
    },
    playing: state.playing,
    volume: state.volume,
    muted: state.muted,
    playedRequestsTonight: state.playedRequestsTonight,
    nowPlaying: current
      ? {
          trackId: current.id,
          title: current.title,
          artist: current.artist,
          durationSec: current.durationSec,
          elapsedSec: Math.min(Math.floor(state.positionSec), current.durationSec),
          source: state.currentSource
        }
      : null,
    queue: store.queueItems
      .filter((item) => item.venueId === venue.id && item.status === QueueItemStatus.QUEUED)
      .sort((left, right) => left.position - right.position)
      .map((item, index) => {
        const track = trackById(store, item.trackId);
        return {
          id: item.id,
          orderId: item.orderId,
          trackId: item.trackId,
          title: track?.title ?? "—",
          artist: track?.artist ?? "—",
          durationSec: track?.durationSec ?? 0,
          position: index + 1
        };
      })
  };
}

export type DemoPlayerCommand =
  | { action: "toggle" }
  | { action: "skip" }
  | { action: "restart" }
  | { action: "volume"; value: number }
  | { action: "mute" }
  | { action: "moveUp"; queueItemId: string }
  | { action: "playNow"; queueItemId: string }
  | { action: "remove"; queueItemId: string }
  | { action: "accept"; value: boolean };

export function applyDemoPlayerCommand(venueId: string, command: DemoPlayerCommand) {
  const store = getStore();
  const venue = store.venues.find((item) => item.id === venueId);
  if (!venue) {
    return { error: "Заведение не найдено." as const };
  }

  const state = advancePlayer(store, venue);

  switch (command.action) {
    case "toggle": {
      state.playing = !state.playing;
      state.lastTickAt = Date.now();
      break;
    }
    case "skip": {
      const current = trackById(store, state.currentTrackId);
      if (current) {
        logPlayback(store, state, Math.min(Math.floor(state.positionSec), current.durationSec));
      }
      state.positionSec = 0;
      startNextTrack(store, venue, state);
      break;
    }
    case "restart": {
      state.positionSec = 0;
      state.lastTickAt = Date.now();
      break;
    }
    case "volume": {
      state.volume = Math.max(0, Math.min(100, Math.round(command.value)));
      state.muted = false;
      break;
    }
    case "mute": {
      state.muted = !state.muted;
      break;
    }
    case "moveUp": {
      const queued = store.queueItems
        .filter((item) => item.venueId === venueId && item.status === QueueItemStatus.QUEUED)
        .sort((left, right) => left.position - right.position);
      const index = queued.findIndex((item) => item.id === command.queueItemId);
      if (index > 0) {
        const positions = [queued[index - 1].position, queued[index].position];
        queued[index].position = positions[0];
        queued[index - 1].position = positions[1];
      }
      break;
    }
    case "playNow": {
      const item = store.queueItems.find(
        (entry) =>
          entry.id === command.queueItemId &&
          entry.venueId === venueId &&
          entry.status === QueueItemStatus.QUEUED
      );
      if (!item) {
        return { error: "Элемент очереди не найден." as const };
      }

      const current = trackById(store, state.currentTrackId);
      if (current) {
        logPlayback(store, state, Math.min(Math.floor(state.positionSec), current.durationSec));
      }

      item.status = QueueItemStatus.PLAYED;
      item.playedAt = new Date();
      state.currentTrackId = item.trackId;
      state.currentSource = "request";
      state.currentQueueItemId = item.id;
      state.positionSec = 0;
      state.lastTickAt = Date.now();
      state.playedRequestsTonight += 1;
      break;
    }
    case "remove": {
      const item = store.queueItems.find(
        (entry) =>
          entry.id === command.queueItemId &&
          entry.venueId === venueId &&
          entry.status === QueueItemStatus.QUEUED
      );
      if (!item) {
        return { error: "Элемент очереди не найден." as const };
      }

      item.status = QueueItemStatus.REMOVED;
      item.removedAt = new Date();
      const order = store.orders.find((entry) => entry.id === item.orderId);
      if (order) {
        order.status = "FAILED";
        order.updatedAt = new Date();
      }
      break;
    }
    case "accept": {
      venue.isAcceptingRequests = command.value;
      break;
    }
  }

  return { snapshot: getDemoPlayerSnapshot(venueId)! };
}

export function updateDemoVenueBranding(venueId: string, accentColor: string) {
  const store = getStore();
  const venue = store.venues.find((item) => item.id === venueId);
  if (!venue) {
    return { error: "Заведение не найдено." as const };
  }

  venue.accentColor = accentColor;
  return { venue };
}

export function updateDemoVenueTariff(venueId: string, tariff: VenueTariff) {
  const store = getStore();
  const venue = store.venues.find((item) => item.id === venueId);
  if (!venue) {
    return { error: "Заведение не найдено." as const };
  }

  venue.tariff = tariff;
  return { venue };
}

export function getDemoVenueOrders(venueId: string) {
  const store = getStore();
  return store.orders
    .filter((order) => order.venueId === venueId)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .map((order) => ({
      ...order,
      track: store.tracks.find((track) => track.id === order.trackId) ?? null
    }));
}

export function getDemoPlaybackLog(venueId: string, limit = 50) {
  const store = getStore();
  return store.playbackLog
    .filter((entry) => entry.venueId === venueId)
    .slice(0, limit)
    .map((entry) => ({
      ...entry,
      track: trackById(store, entry.trackId)
    }));
}
