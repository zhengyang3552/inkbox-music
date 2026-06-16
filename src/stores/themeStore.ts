import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GradientPresetName } from "../utils/gradientCover";

export type ThemeMode = "dark" | "black" | "system";
export type AccentColor = "blue-violet" | "pink-violet" | "cyan" | "orange-red" | "green";

interface ThemeState {
  mode: ThemeMode;
  accent: AccentColor;
  glass: boolean;
  coverBlur: boolean;
  lyricBlur: boolean;
  reduceMotion: boolean;
  globalGradientPreset: GradientPresetName;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  setGlass: (glass: boolean) => void;
  setCoverBlur: (coverBlur: boolean) => void;
  setLyricBlur: (lyricBlur: boolean) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setGlobalGradientPreset: (globalGradientPreset: GradientPresetName) => void;
}

function applyTheme(state: Pick<ThemeState, "mode" | "accent" | "glass" | "coverBlur" | "reduceMotion"> & Partial<Pick<ThemeState, "lyricBlur">>) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme =
    state.mode === "system" ? (systemDark ? "dark" : "light") : state.mode;
  document.documentElement.dataset.themeMode = state.mode;
  document.documentElement.dataset.accent = state.accent;
  document.documentElement.dataset.glass = String(state.glass);
  document.documentElement.dataset.coverBlur = String(state.coverBlur);
  document.documentElement.dataset.lyricBlur = String(state.lyricBlur ?? true);
  document.documentElement.dataset.reduceMotion = String(state.reduceMotion);
}

export const useThemeStore = create<ThemeState>()(persist((set, get) => ({
  mode: "dark",
  accent: "pink-violet",
  glass: true,
  coverBlur: true,
  lyricBlur: true,
  reduceMotion: false,
  globalGradientPreset: "Midnight Aurora",
  setMode: (mode) => set({ mode }),
  setAccent: (accent) => set({ accent }),
  setGlass: (glass) => set({ glass }),
  setCoverBlur: (coverBlur) => set({ coverBlur }),
  setLyricBlur: (lyricBlur) => set({ lyricBlur }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  setGlobalGradientPreset: (globalGradientPreset) => set({ globalGradientPreset }),
}), {
  name: "inkbox-theme",
  version: 1,
  onRehydrateStorage: () => (state) => {
    if (state) applyTheme(state);
  },
}));

useThemeStore.subscribe((state) => applyTheme(state));
applyTheme(useThemeStore.getState());
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  const state = useThemeStore.getState();
  if (state.mode === "system") applyTheme(state);
});
