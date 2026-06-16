import { invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { exists } from "@tauri-apps/plugin-fs";
import { readTextFile } from "@tauri-apps/plugin-fs";
import type { Song } from "../types/music";
import type { AmllLyricLine, LyricLine } from "../types/lyric";
import { replaceExtension } from "../utils/file";
import { parseLrc, toAmllLines } from "../utils/parseLrc";
import {
  chooseBrowserFiles,
  readBrowserTextFile,
  registerBrowserTextFile,
} from "./browserFileService";

export interface ParsedLyrics {
  lines: LyricLine[];
  amllLines: AmllLyricLine[];
  plainLines?: string[];
  source?: LyricsSource;
}

export type LyricsSource = "local-import" | "same-name" | "lrclib-synced" | "lrclib-plain" | "none";

function fromLrcText(source: string, lyricsSource?: LyricsSource): ParsedLyrics {
  const lines = parseLrc(source);
  return { lines, amllLines: toAmllLines(lines), source: lyricsSource };
}

function fromPlainText(source: string, lyricsSource: LyricsSource): ParsedLyrics {
  return {
    lines: [],
    amllLines: [],
    plainLines: source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    source: lyricsSource,
  };
}

export async function readLyrics(path: string): Promise<ParsedLyrics> {
  let source: string;
  if (path.startsWith("browser-file://")) {
    source = await readBrowserTextFile(path);
  } else if (isTauri()) {
    try {
      source = await readTextFile(path);
    } catch {
      source = await invoke<string>("read_text_file", { path });
    }
  } else {
    source = await readTextFile(path);
  }
  return fromLrcText(source);
}

async function readSameNameLyrics(song: Song): Promise<ParsedLyrics | null> {
  if (song.sourceType !== "tauri") return null;
  const candidate = replaceExtension(song.path, "lrc");
  try {
    if (!(await exists(candidate))) return null;
    const result = await readLyrics(candidate);
    if (result.lines.length === 0) return null;
    return { ...result, source: "same-name" };
  } catch {
    return null;
  }
}

export async function readSongLyrics(song: Song): Promise<ParsedLyrics> {
  if (song.lyricPath) {
    try {
      const result = await readLyrics(song.lyricPath);
      if (result.lines.length > 0) return { ...result, source: song.lyricSource ?? "local-import" };
    } catch {
      // Continue to same-name and cached online lyrics.
    }
  }

  const sameNameLyrics = await readSameNameLyrics(song);
  if (sameNameLyrics) return sameNameLyrics;

  if (song.onlineLyrics?.syncedLyrics) {
    const result = fromLrcText(song.onlineLyrics.syncedLyrics, "lrclib-synced");
    if (result.lines.length > 0) return result;
  }

  if (song.onlineLyrics?.plainLyrics) {
    return fromPlainText(song.onlineLyrics.plainLyrics, "lrclib-plain");
  }

  return { lines: [], amllLines: [], source: "none" };
}

export function lyricSourceLabel(song: Song): string {
  if (song.lyricPath) return song.lyricSource === "same-name" ? "同名文件" : "本地导入";
  if (song.onlineLyrics?.provider === "lrclib") return "LRCLIB";
  return "无歌词";
}

export async function chooseLyricFile(): Promise<string | null> {
  if (!isTauri()) {
    const [file] = await chooseBrowserFiles({
      accept: ".lrc,text/plain",
    });
    return file ? await registerBrowserTextFile(file) : null;
  }

  const result = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "LRC 歌词", extensions: ["lrc"] }],
  });
  return typeof result === "string" ? result : null;
}
