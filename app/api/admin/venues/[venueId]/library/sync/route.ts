import { NextResponse } from "next/server";

import { canManageVerifiedVenue } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  MusicLibraryConfigurationError,
  MusicLibraryRequestError,
  syncMusicLibrary
} from "@/lib/music-library";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;

  if (!(await canManageVerifiedVenue(venueId))) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  if (env.demoMode) {
    return NextResponse.json(
      { error: "Синхронизация медиатеки недоступна в демо-режиме." },
      { status: 409 }
    );
  }

  try {
    const result = await syncMusicLibrary();
    const parts = [
      `Добавлено: ${result.created}`,
      `обновлено: ${result.updated}`,
      result.skipped > 0 ? `пропущено: ${result.skipped}` : null
    ].filter(Boolean);

    return NextResponse.json({
      ...result,
      message: `Медиатека синхронизирована. ${parts.join(", ")}.${
        result.hasMore ? " Есть ещё треки, нажмите кнопку ещё раз." : ""
      }`
    });
  } catch (error) {
    if (error instanceof MusicLibraryConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof MusicLibraryRequestError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    console.error(error);
    return NextResponse.json({ error: "Не удалось синхронизировать медиатеку." }, { status: 500 });
  }
}
