import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Song } from "../types/music";

interface LibraryState {
  songs: Song[];
  isImporting: boolean;
  error: string | null;
  addSongs: (songs: Song[]) => void;
  updateSong: (id: string, changes: Partial<Song>) => void;
  removeSong: (id: string) => void;
  setImporting: (value: boolean) => void;
  setError: (message: string | null) => void;
}

function sanitizeSong(song: Song): Song {
  const { customCover: _customCover, coverUrl: _coverUrl, gradientCover: _gradientCover, coverMode: _coverMode, ...rest } = song;
  return rest;
}

export const useLibraryStore = create<LibraryState>()(persist((set) => ({
  songs: [],
  isImporting: false,
  error: null,
  addSongs: (incoming) =>
    set((state) => {
      const known = new Set(state.songs.map((song) => song.path));
      return { songs: [...state.songs, ...incoming.filter((song) => !known.has(song.path)).map(sanitizeSong)] };
    }),
  updateSong: (id, changes) =>
    set((state) => ({
      songs: state.songs.map((song) => (song.id === id ? sanitizeSong({ ...song, ...changes }) : song)),
    })),
  removeSong: (id) =>
    set((state) => ({ songs: state.songs.filter((song) => song.id !== id) })),
  setImporting: (isImporting) => set({ isImporting }),
  setError: (error) => set({ error }),
}), {
  name: "inkbox-library",
  version: 3,
  migrate: (persisted) => {
    const state = persisted as Partial<LibraryState>;
    return {
      ...state,
      songs: (state.songs ?? []).filter(
        (song) => song.sourceType === "tauri" || song.path.startsWith("browser-audio://"),
      ).map(sanitizeSong),
    } as LibraryState;
  },
  partialize: (state) => ({ songs: state.songs }),
}));
