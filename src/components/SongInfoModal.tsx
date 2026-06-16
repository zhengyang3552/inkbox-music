import { X } from "lucide-react";
import { lyricSourceLabel } from "../services/lyricService";
import type { Song } from "../types/music";
import { formatTime } from "../utils/formatTime";
import { CoverArt } from "./CoverArt";

interface SongInfoModalProps {
  song: Song;
  onClose: () => void;
}

function fileSize(bytes?: number): string {
  if (!bytes) return "未知";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function SongInfoModal({ song, onClose }: SongInfoModalProps) {
  const coverSource = song.embeddedCover ? "内嵌封面" : "默认渐变封面";
  const rows = [
    ["标题", song.title],
    ["歌手", song.artist],
    ["专辑", song.album],
    ["年份", song.year ?? "未知"],
    ["流派", song.genre?.join(" / ") || "未知"],
    ["时长", formatTime(song.duration)],
    ["文件路径", song.path],
    ["文件格式", song.container || "未知"],
    ["文件大小", fileSize(song.fileSize)],
    ["码率", song.bitrate ? `${Math.round(song.bitrate / 1000)} kbps` : "未知"],
    ["采样率", song.sampleRate ? `${song.sampleRate} Hz` : "未知"],
    ["声道数", song.channels ?? "未知"],
    ["歌词来源", lyricSourceLabel(song)],
    ["封面来源", coverSource],
    ["Metadata 来源", ({ embedded: "内嵌", filename: "文件名推断", user: "用户编辑" })[song.metadataSource ?? "filename"]],
  ];

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal info-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal__header">
          <div><span className="eyebrow">FILE DETAILS</span><h2>歌曲信息</h2></div>
          <button className="icon-button" title="关闭" onClick={onClose}><X /></button>
        </header>
        <div className="info-modal__body">
          <CoverArt song={song} size="large" />
          <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </div>
      </section>
    </div>
  );
}
