import type { Song } from "../types/music";

export interface LyricsSearchParams {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
}

export interface LrclibLyricsResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
}

const LRCLIB_API = "https://lrclib.net/api";

function clean(value?: string): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function resultFromRaw(raw: Record<string, unknown>): LrclibLyricsResult {
  return {
    id: Number(raw.id),
    trackName: String(raw.trackName ?? raw.name ?? ""),
    artistName: String(raw.artistName ?? ""),
    albumName: typeof raw.albumName === "string" ? raw.albumName : undefined,
    duration: typeof raw.duration === "number" ? raw.duration : undefined,
    instrumental: Boolean(raw.instrumental),
    plainLyrics: typeof raw.plainLyrics === "string" ? raw.plainLyrics : null,
    syncedLyrics: typeof raw.syncedLyrics === "string" ? raw.syncedLyrics : null,
  };
}

export async function searchLrclibLyrics(params: LyricsSearchParams): Promise<LrclibLyricsResult[]> {
  const query = new URLSearchParams();
  const title = clean(params.title);
  const artist = clean(params.artist);
  const album = clean(params.album);

  if (title) query.set("track_name", title);
  if (artist) query.set("artist_name", artist);
  if (album) query.set("album_name", album);
  if (params.duration && params.duration > 0) query.set("duration", String(Math.round(params.duration)));

  if (!title && !artist) query.set("q", [params.title, params.artist, params.album].map(clean).filter(Boolean).join(" "));
  const response = await fetch(`${LRCLIB_API}/search?${query.toString()}`, {
    headers: { "Accept": "application/json" },
  });
  if (!response.ok) throw new Error(`LRCLIB search failed: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => resultFromRaw(item as Record<string, unknown>))
    .filter((item) => item.id && item.trackName && item.artistName);
}

export function toOnlineLyrics(result: LrclibLyricsResult): NonNullable<Song["onlineLyrics"]> {
  return {
    provider: "lrclib",
    id: result.id,
    trackName: result.trackName,
    artistName: result.artistName,
    albumName: result.albumName,
    duration: result.duration,
    syncedLyrics: result.syncedLyrics ?? null,
    plainLyrics: result.plainLyrics ?? null,
    fetchedAt: Date.now(),
  };
}
