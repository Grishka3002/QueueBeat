import { NextResponse } from "next/server";

import { demoOwnerCookieName } from "@/lib/auth";
import { env } from "@/lib/env";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: env.sessionCookieName, value: "", path: "/", maxAge: 0 });
  response.cookies.set({ name: demoOwnerCookieName, value: "", path: "/", maxAge: 0 });
  return response;
}
