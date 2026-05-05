import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";

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
    redirect("/admin/login");
  }
}

export function getAdminSessionToken() {
  if (!env.hasAdminPassword) {
    throw new Error("ADMIN_PASSWORD must be configured.");
  }

  return sessionValue(env.adminPassword);
}
