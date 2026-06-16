import { FileMusic, Pause, Play, Search, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import { CoverArt, getSongCoverUrl } from "../components/CoverArt";
import { CoverBackground } from "../components/CoverBackground";
import { EmptyState } from "../components/EmptyState";
import { LyricView } from "../components/LyricView";
import { OnlineLyricsModal } from "../components/OnlineLyricsModal";
import {
  chooseLyricFile,
  readLyrics,
  readSongLyrics,
  type ParsedLyrics,
} from "../services/lyricService";
import { useLibraryStore } from "../stores/libraryStore";
import { usePlayerStore } from "../stores/playerStore";
import { useUiStore } from "../stores/uiStore";
import type { Song } from "../types/music";

const emptyLyrics: ParsedLyrics = { lines: [], amllLines: [], source: "none" };

export function NowPlayingPage() {
  const player = usePlayerStore();
  const updateSong = useLibraryStore((state) => state.updateSong);
  const showToast = useUiStore((state) => state.showToast);
  const [lyrics, setLyrics] = useState<ParsedLyrics>(emptyLyrics);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [showOnlineLyrics, setShowOnlineLyrics] = useState(false);

  useEffect(() => {
    setLyrics(emptyLyrics);
    if (!player.currentSong) return;
    setIsLoadingLyrics(true);
    void readSongLyrics(player.currentSong)
      .then((result) => {
        setLyrics(result);
        if (result.source === "lrclib-plain") {
          showToast("仅有纯文本歌词，无法同步滚动", "info");
        } else if (result.source !== "none" && result.lines.length === 0) {
          showToast("歌词文件中没有可识别的时间标签", "info");
        }
      })
      .catch(() => {
        setLyrics(emptyLyrics);
        showToast("歌词读取失败，请检查文件编码。", "error");
      })
      .finally(() => setIsLoadingLyrics(false));
  }, [player.currentSong?.id, player.currentSong?.lyricPath, player.currentSong?.onlineLyrics?.id, showToast]);

  async function importLyrics() {
    if (!player.currentSong) return;
    try {
      const path = await chooseLyricFile();
      if (!path) return;
      setIsLoadingLyrics(true);
      const result = await readLyrics(path);
      if (result.lines.length === 0) {
        showToast("没有匹配到有效的 LRC 时间行", "error");
        return;
      }
      setLyrics(result);
      updateSong(player.currentSong.id, { lyricPath: path, lyricSource: "local-import" });
      usePlayerStore.setState({
        currentSong: { ...player.currentSong, lyricPath: path, lyricSource: "local-import" },
      });
      showToast("歌词导入成功", "success");
    } catch {
      showToast("无法解析这个 LRC 文件，请检查格式或编码。", "error");
    } finally {
      setIsLoadingLyrics(false);
    }
  }

  function bindOnlineLyrics(onlineLyrics: NonNullable<Song["onlineLyrics"]>) {
    if (!player.currentSong) return;
    updateSong(player.currentSong.id, { onlineLyrics });
    usePlayerStore.setState({
      currentSong: { ...player.currentSong, onlineLyrics },
    });
    setShowOnlineLyrics(false);
    showToast(onlineLyrics.syncedLyrics ? "在线歌词已绑定" : "已绑定纯文本歌词", "success");
  }

  if (!player.currentSong) {
    return (
      <main className="now-playing-empty page-enter">
        <EmptyState
          icon={FileMusic}
          title="还没有正在播放的歌曲"
          description="回到音乐库，双击一首喜欢的歌。"
        />
      </main>
    );
  }

  return (
    <main className="now-playing-page page-enter" key={player.currentSong.id}>
      <CoverBackground coverUrl={getSongCoverUrl(player.currentSong)} />
      <section className="now-playing__art">
        <div className={`now-playing__cover ${player.isPlaying ? "is-playing" : ""}`}>
          <CoverArt song={player.currentSong} size="large" />
        </div>
        <div className="now-playing__meta">
          <h1>{player.currentSong.title}</h1>
          <p>{player.currentSong.artist}</p>
          <span>{player.currentSong.album}</span>
        </div>
        <div className="now-playing__controls">
          <button className="icon-button icon-button--large" title="上一首" onClick={() => void player.playPrevious()}>
            <SkipBack />
          </button>
          <button
            className={`play-button play-button--large ${player.isLoading ? "is-loading" : ""}`}
            title={player.isPlaying ? "暂停" : "播放"}
            onClick={() => void player.togglePlay()}
            disabled={player.isLoading}
          >
            {player.isPlaying ? <Pause /> : <Play />}
          </button>
          <button className="icon-button icon-button--large" title="下一首" onClick={() => void player.playNext()}>
            <SkipForward />
          </button>
        </div>
        <div className="now-playing__lyric-actions">
          <button className="ghost-button" onClick={() => setShowOnlineLyrics(true)}>
            <Search />
            在线获取歌词
          </button>
          <button className="ghost-button" onClick={() => void importLyrics()} disabled={isLoadingLyrics}>
            <FileMusic />
            {isLoadingLyrics ? "正在读取歌词…" : "导入 LRC 歌词"}
          </button>
        </div>
      </section>
      <section className={`now-playing__lyrics ${isLoadingLyrics ? "is-loading" : ""}`}>
        {isLoadingLyrics && <span className="lyrics-loading"><i className="spinner" />正在读取歌词</span>}
        <LyricView
          lines={lyrics.lines}
          amllLines={lyrics.amllLines}
          plainLines={lyrics.plainLines}
          currentTime={player.currentTime}
          isPlaying={player.isPlaying}
          onSeek={(seconds) => player.seekTo(seconds, player.isPlaying)}
          onImport={() => void importLyrics()}
        />
      </section>
      {showOnlineLyrics && player.currentSong && (
        <OnlineLyricsModal
          song={player.currentSong}
          onClose={() => setShowOnlineLyrics(false)}
          onUse={bindOnlineLyrics}
        />
      )}
    </main>
  );
}
