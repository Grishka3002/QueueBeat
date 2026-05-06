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

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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
  const businessTypeInput = ensureString(data.businessType, "businessType");
  const legalName = ensureString(data.legalName, "legalName");
  const inn = ensureString(data.inn, "inn").replace(/\D/g, "");
  const kpp = optionalString(data.kpp)?.replace(/\D/g, "") ?? null;
  const ogrn = optionalString(data.ogrn)?.replace(/\D/g, "") ?? null;
  const ogrnip = optionalString(data.ogrnip)?.replace(/\D/g, "") ?? null;
  const legalAddress = ensureString(data.legalAddress, "legalAddress");
  const actualAddress = optionalString(data.actualAddress);
  const contactName = ensureString(data.contactName, "contactName");
  const contactPhone = ensureString(data.contactPhone, "contactPhone");
  const bankName = optionalString(data.bankName);
  const bankBik = optionalString(data.bankBik)?.replace(/\D/g, "") ?? null;
  const bankAccount = optionalString(data.bankAccount)?.replace(/\D/g, "") ?? null;
  const corrAccount = optionalString(data.corrAccount)?.replace(/\D/g, "") ?? null;

  if (ownerName.length < 2 || ownerName.length > 80) {
    throw new ValidationError("Owner name must be between 2 and 80 characters.");
  }

  if (venueName.length < 2 || venueName.length > 80) {
    throw new ValidationError("Venue name must be between 2 and 80 characters.");
  }

  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    throw new ValidationError("Slug must be 3-40 chars and use lowercase letters, numbers, or dashes.");
  }

  if (businessTypeInput !== "INDIVIDUAL_ENTREPRENEUR" && businessTypeInput !== "LLC") {
    throw new ValidationError("Business type must be IP or LLC.");
  }

  const businessType: "INDIVIDUAL_ENTREPRENEUR" | "LLC" = businessTypeInput;

  if (legalName.length < 2 || legalName.length > 180) {
    throw new ValidationError("Legal business name must be between 2 and 180 characters.");
  }

  if (businessType === "INDIVIDUAL_ENTREPRENEUR") {
    if (!/^\d{12}$/.test(inn)) {
      throw new ValidationError("IP INN must contain 12 digits.");
    }
    if (!ogrnip || !/^\d{15}$/.test(ogrnip)) {
      throw new ValidationError("OGRNIP must contain 15 digits.");
    }
  }

  if (businessType === "LLC") {
    if (!/^\d{10}$/.test(inn)) {
      throw new ValidationError("LLC INN must contain 10 digits.");
    }
    if (!kpp || !/^\d{9}$/.test(kpp)) {
      throw new ValidationError("KPP must contain 9 digits for LLC.");
    }
    if (!ogrn || !/^\d{13}$/.test(ogrn)) {
      throw new ValidationError("OGRN must contain 13 digits for LLC.");
    }
  }

  if (legalAddress.length < 10 || legalAddress.length > 240) {
    throw new ValidationError("Legal address must be between 10 and 240 characters.");
  }

  if (actualAddress && actualAddress.length > 240) {
    throw new ValidationError("Actual address must be under 240 characters.");
  }

  if (contactName.length < 2 || contactName.length > 120) {
    throw new ValidationError("Representative name must be between 2 and 120 characters.");
  }

  if (!/^\+?[0-9\s()-]{7,24}$/.test(contactPhone)) {
    throw new ValidationError("Enter a valid representative phone.");
  }

  if (bankBik && !/^\d{9}$/.test(bankBik)) {
    throw new ValidationError("Bank BIK must contain 9 digits.");
  }

  if (bankAccount && !/^\d{20}$/.test(bankAccount)) {
    throw new ValidationError("Bank account must contain 20 digits.");
  }

  if (corrAccount && !/^\d{20}$/.test(corrAccount)) {
    throw new ValidationError("Correspondent account must contain 20 digits.");
  }

  return {
    ...account,
    ownerName,
    venueName,
    slug,
    businessProfile: {
      businessType,
      legalName,
      inn,
      kpp,
      ogrn,
      ogrnip,
      legalAddress,
      actualAddress,
      contactName,
      contactPhone,
      contactEmail: account.email,
      bankName,
      bankBik,
      bankAccount,
      corrAccount
    }
  };
}
