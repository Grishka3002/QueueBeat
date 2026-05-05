export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function ensureString(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new ValidationError(`Field "${field}" is required.`);
  }
  return value.trim();
}

export function parseVenueSettingsInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Invalid venue settings payload.");
  }

  const data = input as Record<string, unknown>;
  const name = ensureString(data.name, "name");
  const slug = ensureString(data.slug, "slug").toLowerCase();
  const priceRub = Number(data.priceRub);

  if (name.length < 2 || name.length > 80) {
    throw new ValidationError("Venue name must be between 2 and 80 characters.");
  }

  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    throw new ValidationError("Slug must be 3-40 chars and use lowercase letters, numbers, or dashes.");
  }

  if (!Number.isFinite(priceRub) || priceRub < 1 || priceRub > 10000) {
    throw new ValidationError("Price must be between 1 and 10000 RUB.");
  }

  return {
    name,
    slug,
    priceCents: Math.round(priceRub * 100),
    isAcceptingRequests: Boolean(data.isAcceptingRequests)
  };
}

export function parseTrackSelectionInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Invalid track selection payload.");
  }

  const data = input as Record<string, unknown>;
  const venueId = ensureString(data.venueId, "venueId");
  const trackId = ensureString(data.trackId, "trackId");
  return { venueId, trackId };
}

export function parseMockPaymentInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Invalid payment payload.");
  }

  const data = input as Record<string, unknown>;
  const orderId = ensureString(data.orderId, "orderId");
  return { orderId };
}

export function parseTrackIdsInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Invalid track mapping payload.");
  }

  const data = input as Record<string, unknown>;
  if (!Array.isArray(data.trackIds)) {
    throw new ValidationError("trackIds must be an array.");
  }

  const trackIds = Array.from(
    new Set(data.trackIds.filter((item): item is string => typeof item === "string"))
  );
  return { trackIds };
}

export function parseLoginInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Invalid login payload.");
  }

  const data = input as Record<string, unknown>;
  const email = ensureString(data.email, "email").toLowerCase();
  const password = ensureString(data.password, "password");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ValidationError("Enter a valid email.");
  }

  if (password.length < 8 || password.length > 120) {
    throw new ValidationError("Password must be at least 8 characters.");
  }

  return { email, password };
}

export function parseVenueRegistrationInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Invalid registration payload.");
  }

  const data = input as Record<string, unknown>;
  const account = parseLoginInput(data);
  const ownerName = ensureString(data.ownerName, "ownerName");
  const venueName = ensureString(data.venueName, "venueName");
  const slug = ensureString(data.slug, "slug").toLowerCase();

  if (ownerName.length < 2 || ownerName.length > 80) {
    throw new ValidationError("Owner name must be between 2 and 80 characters.");
  }

  if (venueName.length < 2 || venueName.length > 80) {
    throw new ValidationError("Venue name must be between 2 and 80 characters.");
  }

  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    throw new ValidationError("Slug must be 3-40 chars and use lowercase letters, numbers, or dashes.");
  }

  return {
    ...account,
    ownerName,
    venueName,
    slug
  };
}
