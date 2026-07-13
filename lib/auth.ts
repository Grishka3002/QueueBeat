import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDemoOwnerById } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const demoOwnerCookieName = "queuebeat-demo-owner";

export type SessionOwner = {
  id: string;
  name: string;
  email: string;
  venueIds: string[];
};

function sessionValue(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function isAdminAuthenticated() {
  if (!env.hasAdminPassword) {
    return false;
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(env.adminCookieName)?.value;
  if (!cookieValue) {
    return false;
  }

  const expected = Buffer.from(sessionValue(env.adminPassword));
  const actual = Buffer.from(cookieValue);
  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export async function requireAdmin() {
  const isAuthed = await isAdminAuthenticated();
  if (!isAuthed) {
    redirect("/platform/login");
  }
}

export function getAdminSessionToken() {
  if (!env.hasAdminPassword) {
    throw new Error("ADMIN_PASSWORD must be configured.");
  }

  return sessionValue(env.adminPassword);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const actual = Buffer.from(scryptSync(password, salt, 64).toString("hex"));
  const expected = Buffer.from(hash);
  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}

function userSessionValue(userId: string, passwordHash: string) {
  if (!env.authSecret) {
    throw new Error("AUTH_SECRET must be configured.");
  }

  return createHash("sha256")
    .update(`${userId}:${passwordHash}:${env.authSecret}`)
    .digest("hex");
}

export function getUserSessionToken(userId: string, passwordHash: string) {
  return `${userId}.${userSessionValue(userId, passwordHash)}`;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(env.sessionCookieName)?.value;
  if (!cookieValue) {
    return null;
  }

  const [userId, signature] = cookieValue.split(".");
  if (!userId || !signature) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      venues: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!user?.passwordHash) {
    return null;
  }

  const expected = Buffer.from(userSessionValue(user.id, user.passwordHash));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  return user;
}

function demoOwnerSignature(ownerId: string) {
  return createHash("sha256").update(`demo-owner:${ownerId}:${env.authSecret}`).digest("hex");
}

export function getDemoOwnerSessionToken(ownerId: string) {
  return `${ownerId}.${demoOwnerSignature(ownerId)}`;
}

export async function getDemoSessionOwner(): Promise<SessionOwner | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(demoOwnerCookieName)?.value;
  if (!cookieValue) {
    return null;
  }

  const [ownerId, signature] = cookieValue.split(".");
  if (!ownerId || !signature) {
    return null;
  }

  const expected = Buffer.from(demoOwnerSignature(ownerId));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  const owner = getDemoOwnerById(ownerId);
  if (!owner) {
    return null;
  }

  return { id: owner.id, name: owner.name, email: owner.email, venueIds: owner.venueIds };
}

// единая точка «кто сейчас в кабинете»: демо-владелец или пользователь из БД
export async function getSessionOwner(): Promise<SessionOwner | null> {
  if (env.demoMode) {
    return getDemoSessionOwner();
  }

  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    venueIds: user.venues.map((venue) => venue.id)
  };
}

export async function requireVenueOwner() {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
    redirect("/login");
  }

  return user;
}

export async function canManageVenue(venueId: string) {
  if (await isAdminAuthenticated()) {
    return true;
  }

  if (env.demoMode) {
    const owner = await getDemoSessionOwner();
    return Boolean(owner?.venueIds.includes(venueId));
  }

  const user = await getCurrentUser();
  return Boolean(user?.venues.some((venue) => venue.id === venueId));
}

export async function canManageVerifiedVenue(venueId: string) {
  if (env.demoMode) {
    return canManageVenue(venueId);
  }

  if (await isAdminAuthenticated()) {
    return true;
  }

  const user = await getCurrentUser();
  return Boolean(
    user?.venues.some((venue) => venue.id === venueId && venue.verificationStatus === "VERIFIED")
  );
}
