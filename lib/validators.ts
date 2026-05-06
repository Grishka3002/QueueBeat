export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function ensureString(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new ValidationError(`Поле "${field}" обязательно.`);
  }
  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function parseVenueSettingsInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Некорректные данные настроек заведения.");
  }

  const data = input as Record<string, unknown>;
  const name = ensureString(data.name, "name");
  const slug = ensureString(data.slug, "slug").toLowerCase();
  const priceRub = Number(data.priceRub);

  if (name.length < 2 || name.length > 80) {
    throw new ValidationError("Название заведения должно быть от 2 до 80 символов.");
  }

  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    throw new ValidationError("Slug должен быть от 3 до 40 символов и содержать только латинские строчные буквы, цифры или дефисы.");
  }

  if (!Number.isFinite(priceRub) || priceRub < 1 || priceRub > 10000) {
    throw new ValidationError("Цена должна быть от 1 до 10000 ₽.");
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
    throw new ValidationError("Некорректные данные выбора трека.");
  }

  const data = input as Record<string, unknown>;
  const venueId = ensureString(data.venueId, "venueId");
  const trackId = ensureString(data.trackId, "trackId");
  return { venueId, trackId };
}

export function parseMockPaymentInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Некорректные данные оплаты.");
  }

  const data = input as Record<string, unknown>;
  const orderId = ensureString(data.orderId, "orderId");
  return { orderId };
}

export function parseTrackIdsInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Некорректные данные списка треков.");
  }

  const data = input as Record<string, unknown>;
  if (!Array.isArray(data.trackIds)) {
    throw new ValidationError("trackIds должен быть массивом.");
  }

  const trackIds = Array.from(
    new Set(data.trackIds.filter((item): item is string => typeof item === "string"))
  );
  return { trackIds };
}

export function parseLoginInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Некорректные данные входа.");
  }

  const data = input as Record<string, unknown>;
  const email = ensureString(data.email, "email").toLowerCase();
  const password = ensureString(data.password, "password");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ValidationError("Введите корректный email.");
  }

  if (password.length < 8 || password.length > 120) {
    throw new ValidationError("Пароль должен быть минимум 8 символов.");
  }

  return { email, password };
}

export function parseVenueRegistrationInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Некорректные данные регистрации.");
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
  const legalAddress = optionalString(data.legalAddress) ?? "Не указан при быстрой регистрации";
  const actualAddress = optionalString(data.actualAddress);
  const contactName = optionalString(data.contactName) ?? ownerName;
  const contactPhone = ensureString(data.contactPhone, "contactPhone");
  const bankName = optionalString(data.bankName);
  const bankBik = optionalString(data.bankBik)?.replace(/\D/g, "") ?? null;
  const bankAccount = optionalString(data.bankAccount)?.replace(/\D/g, "") ?? null;
  const corrAccount = optionalString(data.corrAccount)?.replace(/\D/g, "") ?? null;

  if (ownerName.length < 2 || ownerName.length > 80) {
    throw new ValidationError("Имя владельца должно быть от 2 до 80 символов.");
  }

  if (venueName.length < 2 || venueName.length > 80) {
    throw new ValidationError("Название заведения должно быть от 2 до 80 символов.");
  }

  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    throw new ValidationError("Slug должен быть от 3 до 40 символов и содержать только латинские строчные буквы, цифры или дефисы.");
  }

  if (businessTypeInput !== "INDIVIDUAL_ENTREPRENEUR" && businessTypeInput !== "LLC") {
    throw new ValidationError("Тип бизнеса должен быть ИП или ООО.");
  }

  const businessType: "INDIVIDUAL_ENTREPRENEUR" | "LLC" = businessTypeInput;

  if (legalName.length < 2 || legalName.length > 180) {
    throw new ValidationError("Юридическое название должно быть от 2 до 180 символов.");
  }

  if (businessType === "INDIVIDUAL_ENTREPRENEUR") {
    if (!/^\d{12}$/.test(inn)) {
      throw new ValidationError("ИНН ИП должен содержать 12 цифр.");
    }
  }

  if (businessType === "LLC") {
    if (!/^\d{10}$/.test(inn)) {
      throw new ValidationError("ИНН ООО должен содержать 10 цифр.");
    }
  }

  if (kpp && !/^\d{9}$/.test(kpp)) {
    throw new ValidationError("КПП должен содержать 9 цифр.");
  }

  if (ogrn && !/^\d{13}$/.test(ogrn)) {
    throw new ValidationError("ОГРН должен содержать 13 цифр.");
  }

  if (ogrnip && !/^\d{15}$/.test(ogrnip)) {
    throw new ValidationError("ОГРНИП должен содержать 15 цифр.");
  }

  if (legalAddress && (legalAddress.length < 10 || legalAddress.length > 240)) {
    throw new ValidationError("Юридический адрес должен быть от 10 до 240 символов.");
  }

  if (actualAddress && actualAddress.length > 240) {
    throw new ValidationError("Фактический адрес должен быть до 240 символов.");
  }

  if (contactName.length < 2 || contactName.length > 120) {
    throw new ValidationError("Имя представителя должно быть от 2 до 120 символов.");
  }

  if (!/^\+?[0-9\s()-]{7,24}$/.test(contactPhone)) {
    throw new ValidationError("Введите корректный телефон представителя.");
  }

  if (bankBik && !/^\d{9}$/.test(bankBik)) {
    throw new ValidationError("БИК банка должен содержать 9 цифр.");
  }

  if (bankAccount && !/^\d{20}$/.test(bankAccount)) {
    throw new ValidationError("Расчётный счёт должен содержать 20 цифр.");
  }

  if (corrAccount && !/^\d{20}$/.test(corrAccount)) {
    throw new ValidationError("Корреспондентский счёт должен содержать 20 цифр.");
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
