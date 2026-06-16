export type PlayMode = "sequence" | "repeat-one" | "shuffle";

export interface GradientCover {
  preset: string;
  primary: string;
  secondary: string;
  accent: string;
  direction: number;
  glow: number;
  noise: number;
  vignette: number;
}

export interface Song {
  id: string;
  path: string;
  sourceType: "tauri" | "browser";
  fileName: string;
  title: string;
  artist: string;
  album: string;
  albumArtist?: string;
  year?: number;
  genre?: string[];
  track?: number;
  disk?: number;
  duration: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  codec?: string;
  container?: string;
  fileSize?: number;
  embeddedCover?: string;
  customCover?: string;
  /** Legacy runtime cover field kept for compatibility with existing UI. */
  coverUrl?: string;
  gradientCover?: GradientCover;
  coverMode?: "auto" | "gradient";
  lyricPath?: string;
  lyricSource?: "local-import" | "same-name";
  onlineLyrics?: {
    provider: "lrclib";
    id: number;
    trackName: string;
    artistName: string;
    albumName?: string;
    duration?: number;
    syncedLyrics?: string | null;
    plainLyrics?: string | null;
    fetchedAt: number;
  };
  liked?: boolean;
  unavailable?: boolean;
  metadataSource?: "embedded" | "filename" | "user";
  metadataResolved?: boolean;
}
