import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  searchLrclibLyrics,
  toOnlineLyrics,
  type LrclibLyricsResult,
} from "../services/lyricsProviderService";
import type { Song } from "../types/music";
import { formatTime } from "../utils/formatTime";

interface OnlineLyricsModalProps {
  song: Song;
  onClose: () => void;
  onUse: (lyrics: NonNullable<Song["onlineLyrics"]>) => void;
}

export function OnlineLyricsModal({ song, onClose, onUse }: OnlineLyricsModalProps) {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [album, setAlbum] = useState(song.album);
  const [results, setResults] = useState<LrclibLyricsResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setIsSearching(true);
    setError(null);
    try {
      setResults(await searchLrclibLyrics({ title, artist, album, duration: song.duration }));
    } catch (error) {
      console.error("LRCLIB lyrics search failed", error);
      setError("在线歌词搜索失败，请稍后再试。");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    void search();
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal online-lyrics-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal__header">
          <div><span className="eyebrow">LRCLIB</span><h2>在线获取歌词</h2></div>
          <button className="icon-button" title="关闭" onClick={onClose}><X /></button>
        </header>
        <div className="online-lyrics-modal__body">
          <div className="online-lyrics-form">
            <label><span>标题</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label><span>歌手</span><input value={artist} onChange={(event) => setArtist(event.target.value)} /></label>
            <label><span>专辑</span><input value={album} onChange={(event) => setAlbum(event.target.value)} /></label>
            <button className="primary-button" onClick={() => void search()} disabled={isSearching}>
              <Search />
              {isSearching ? "搜索中" : "搜索"}
            </button>
          </div>
          {error && <p className="inline-error">{error}</p>}
          <div className="online-lyrics-results">
            {results.map((result) => (
              <article className="online-lyrics-result" key={result.id}>
                <div>
                  <strong>{result.trackName}</strong>
                  <span>{result.artistName}</span>
                  <small>{result.albumName || "未知专辑"} · {formatTime(result.duration ?? 0)} · {result.syncedLyrics ? "同步歌词" : result.plainLyrics ? "纯文本歌词" : "无歌词文本"}</small>
                </div>
                <button
                  className="secondary-button"
                  disabled={!result.syncedLyrics && !result.plainLyrics}
                  onClick={() => onUse(toOnlineLyrics(result))}
                >
                  使用此歌词
                </button>
              </article>
            ))}
            {!isSearching && results.length === 0 && (
              <div className="online-lyrics-empty">没有找到匹配歌词，可以调整关键词后重试。</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
