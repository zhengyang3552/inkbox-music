import { invoke } from "@tauri-apps/api/core";
import { exists } from "@tauri-apps/plugin-fs";
import { parseBlob, parseBuffer, type IAudioMetadata } from "music-metadata";
import type { Song } from "../types/music";
import {
  extensionOf,
  fileNameOf,
  replaceExtension,
  stableSongId,
  stemOf,
} from "../utils/file";
import { registerBrowserAudioFile } from "./browserFileService";
import { readAudioDuration } from "./durationService";

function pictureToDataUrl(metadata: IAudioMetadata): string | undefined {
  const picture = metadata.common.picture?.[0];
  if (!picture) return undefined;
  let binary = "";
  for (let index = 0; index < picture.data.length; index += 1) {
    binary += String.fromCharCode(picture.data[index]);
  }
  return `data:${picture.format};base64,${btoa(binary)}`;
}

function metadataFields(
  metadata: IAudioMetadata,
  fallbackTitle: string,
): Partial<Song> {
  const { common, format } = metadata;
  return {
    title: common.title?.trim() || fallbackTitle,
    artist: common.artist?.trim() || "未知艺术家",
    album: common.album?.trim() || "本地音乐",
    albumArtist: common.albumartist,
    year: common.year,
    genre: common.genre,
    track: common.track.no ?? undefined,
    disk: common.disk.no ?? undefined,
    duration: format.duration ?? 0,
    bitrate: format.bitrate,
    sampleRate: format.sampleRate,
    channels: format.numberOfChannels,
    codec: format.codec,
    container: format.container,
    embeddedCover: pictureToDataUrl(metadata),
    metadataSource:
      common.title || common.artist || common.album ? "embedded" : "filename",
  };
}

async function localPathExists(path: string): Promise<boolean> {
  try {
    return await exists(path);
  } catch {
    return false;
  }
}

export async function createSongFromPath(
  path: string,
  lyricPathOverride?: string,
): Promise<Song> {
  const inferredLyricPath = replaceExtension(path, "lrc");
  const fallbackTitle = stemOf(path);
  let parsed: Partial<Song> = {};
  let fileSize: number | undefined;
  let metadataResolved = false;
  try {
    const response = await invoke<ArrayBuffer | Uint8Array | number[]>(
      "read_audio_file",
      { path },
    );
    const bytes =
      response instanceof ArrayBuffer
        ? new Uint8Array(response)
        : Uint8Array.from(response);
    fileSize = bytes.byteLength;
    const metadata = await parseBuffer(
      bytes,
      { path, size: bytes.byteLength },
      { duration: true },
    );
    parsed = metadataFields(metadata, fallbackTitle);
    metadataResolved = true;
  } catch {
    // Metadata failure must not block importing a playable local file.
  }

  const hasSameNameLyric = await localPathExists(inferredLyricPath);
  const song: Song = {
    id: stableSongId(path),
    path,
    sourceType: "tauri",
    fileName: fileNameOf(path),
    title: fallbackTitle,
    artist: "未知艺术家",
    album: "本地音乐",
    duration: -1,
    container: extensionOf(path).toUpperCase(),
    fileSize,
    lyricPath:
      lyricPathOverride ??
      (hasSameNameLyric ? inferredLyricPath : undefined),
    lyricSource: lyricPathOverride ? "local-import" : hasSameNameLyric ? "same-name" : undefined,
    metadataSource: "filename",
    metadataResolved,
    ...parsed,
  };

  if (!(song.duration > 0)) {
    song.duration = await readAudioDuration(song);
  }
  return song;
}

export async function createSongFromBrowserFile(
  file: File,
  lyricPath?: string,
): Promise<Song> {
  const relativePath =
    (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
    file.name;
  const identity = `browser:${relativePath}:${file.size}:${file.lastModified}`;
  const id = stableSongId(identity);
  const path = await registerBrowserAudioFile(file, id);
  const fallbackTitle = stemOf(file.name);
  let parsed: Partial<Song> = {};
  let metadataResolved = false;
  try {
    parsed = metadataFields(
      await parseBlob(file, { duration: true }),
      fallbackTitle,
    );
    metadataResolved = true;
  } catch {
    // Keep the file import even when its tags are malformed.
  }

  const song: Song = {
    id,
    path,
    sourceType: "browser",
    fileName: file.name,
    title: fallbackTitle,
    artist: "未知艺术家",
    album: "本地音乐",
    duration: -1,
    container: extensionOf(file.name).toUpperCase(),
    fileSize: file.size,
    lyricPath,
    lyricSource: lyricPath ? "same-name" : undefined,
    metadataSource: "filename",
    metadataResolved,
    ...parsed,
  };

  if (!(song.duration > 0)) {
    song.duration = await readAudioDuration(song);
  }
  return song;
}

export async function refreshSongMetadata(song: Song): Promise<Partial<Song>> {
  if (song.sourceType !== "tauri") return {};
  const refreshed = await createSongFromPath(song.path);
  return {
    title: refreshed.title,
    artist: refreshed.artist,
    album: refreshed.album,
    albumArtist: refreshed.albumArtist,
    year: refreshed.year,
    genre: refreshed.genre,
    track: refreshed.track,
    disk: refreshed.disk,
    duration: refreshed.duration,
    bitrate: refreshed.bitrate,
    sampleRate: refreshed.sampleRate,
    channels: refreshed.channels,
    codec: refreshed.codec,
    container: refreshed.container,
    fileSize: refreshed.fileSize,
    embeddedCover: refreshed.embeddedCover,
    lyricPath: refreshed.lyricPath ?? song.lyricPath,
    lyricSource: refreshed.lyricSource ?? song.lyricSource,
    metadataSource: refreshed.metadataSource,
    metadataResolved: refreshed.metadataResolved,
  };
}
