import type { CSSProperties } from "react";
import type { GradientCover, Song } from "../types/music";

export const gradientPresets: Record<string, Omit<GradientCover, "preset">> = {
  "Midnight Aurora": { primary: "#111827", secondary: "#0f766e", accent: "#c084fc", direction: 140, glow: 72, noise: 12, vignette: 38 },
  "Sunset Velvet": { primary: "#3f172c", secondary: "#ef5b5b", accent: "#f7c873", direction: 125, glow: 66, noise: 10, vignette: 34 },
  "Ocean Glass": { primary: "#082f49", secondary: "#0891b2", accent: "#a5f3fc", direction: 150, glow: 60, noise: 8, vignette: 32 },
  "Mono Noir": { primary: "#09090b", secondary: "#3f3f46", accent: "#d4d4d8", direction: 135, glow: 35, noise: 18, vignette: 55 },
};

export type GradientPresetName = keyof typeof gradientPresets;

export function gradientForPreset(preset = "Midnight Aurora"): GradientCover {
  const safePreset = preset in gradientPresets ? preset : "Midnight Aurora";
  return { preset: safePreset, ...gradientPresets[safePreset] };
}

export function defaultGradientFor(
  _song?: Pick<Song, "title" | "artist" | "album">,
  preset = "Midnight Aurora",
): GradientCover {
  return gradientForPreset(preset);
}

export function gradientCoverStyle(cover: GradientCover): CSSProperties {
  return {
    "--cover-primary": cover.primary,
    "--cover-secondary": cover.secondary,
    "--cover-accent": cover.accent,
    "--cover-direction": `${cover.direction}deg`,
    "--cover-glow": `${cover.glow}%`,
    "--cover-noise": cover.noise / 100,
    "--cover-vignette": cover.vignette / 100,
  } as CSSProperties;
}
