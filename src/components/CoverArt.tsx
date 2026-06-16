import { Disc3, Music2 } from "lucide-react";
import type { Song } from "../types/music";
import { defaultGradientFor, gradientCoverStyle } from "../utils/gradientCover";
import { useThemeStore } from "../stores/themeStore";

interface CoverArtProps {
  song: Song;
  size?: "small" | "large";
}

export function getSongCoverUrl(song: Song): string | undefined {
  return song.embeddedCover;
}

export function CoverArt({ song, size = "small" }: CoverArtProps) {
  const className = `cover-art cover-art--${size}`;
  const gradientPreset = useThemeStore((state) => state.globalGradientPreset);
  const coverUrl = getSongCoverUrl(song);
  if (coverUrl) return <img className={className} src={coverUrl} alt={`${song.title} 封面`} />;

  const gradient = defaultGradientFor(song, gradientPreset);
  return (
    <div
      className={`${className} cover-art--gradient`}
      style={gradientCoverStyle(gradient)}
      aria-label={`${song.title} 渐变封面`}
    >
      <span className="cover-art__glow" />
      {size === "large" ? <Disc3 /> : <Music2 />}
    </div>
  );
}
