import {
  Heart,
  ListRestart,
  ListMusic,
  Mic2,
  Pause,
  Play,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  PanelTopOpen,
} from "lucide-react";
import { useState, type PointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../stores/playerStore";
import { useLibraryStore } from "../stores/libraryStore";
import { useUiStore } from "../stores/uiStore";
import type { Song } from "../types/music";
import { formatTime } from "../utils/formatTime";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import { CoverArt } from "./CoverArt";
import { useDesktopLyricsStore } from "../stores/desktopLyricsStore";

const modeIcons = {
  sequence: ListRestart,
  "repeat-one": Repeat1,
  shuffle: Shuffle,
};

const modeLabels = {
  sequence: "顺序播放",
  "repeat-one": "单曲循环",
  shuffle: "随机播放",
};

export function PlayerBar() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const updateSong = useLibraryStore((state) => state.updateSong);
  const showToast = useUiStore((state) => state.showToast);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [playlistCandidate, setPlaylistCandidate] = useState<Song | null>(null);
  const desktopLyrics = useDesktopLyricsStore();
  const ModeIcon = modeIcons[player.playMode];
  const shownTime = scrubTime ?? player.currentTime;
  const progress = player.duration ? (shownTime / player.duration) * 100 : 0;
  const currentSong = player.currentSong;

  function commitSeek(event: PointerEvent<HTMLInputElement>) {
    const seconds = Number(event.currentTarget.value);
    setScrubTime(null);
    void player.seekTo(seconds);
  }

  function toggleCurrentSongLiked() {
    if (!currentSong) return;
    const liked = !currentSong.liked;
    updateSong(currentSong.id, { liked });
    usePlayerStore.setState((state) => ({
      currentSong: state.currentSong?.id === currentSong.id
        ? { ...state.currentSong, liked }
        : state.currentSong,
      playlist: state.playlist.map((song) =>
        song.id === currentSong.id ? { ...song, liked } : song,
      ),
    }));
    showToast(liked ? "已加入喜欢" : "已取消喜欢", "success");
  }

  return (
    <>
    <footer className="player-bar">
      <button
        className="player-bar__song"
        onClick={() => currentSong && navigate("/now-playing")}
        disabled={!currentSong}
      >
        {currentSong ? (
          <>
            <CoverArt song={currentSong} />
            <span>
              <strong>{currentSong.title}</strong>
              <small>{currentSong.artist}</small>
            </span>
          </>
        ) : (
          <span className="player-bar__placeholder">双击一首本地歌曲开始播放</span>
        )}
      </button>

      <div className="player-bar__center">
        <div className="transport">
          <button className="icon-button" title="上一首" onClick={() => void player.playPrevious()}>
            <SkipBack />
          </button>
          <button
            className={`play-button ${player.isLoading ? "is-loading" : ""}`}
            title={player.isPlaying ? "暂停" : "播放"}
            onClick={() => void player.togglePlay()}
            disabled={!player.currentSong || player.isLoading}
          >
            {player.isPlaying ? <Pause /> : <Play />}
          </button>
          <button className="icon-button" title="下一首" onClick={() => void player.playNext()}>
            <SkipForward />
          </button>
        </div>
        <div className="timeline">
          <span>{formatTime(shownTime)}</span>
          <div className="timeline-actions">
            <button
              className={`icon-button icon-button--compact ${currentSong?.liked ? "is-accent" : ""}`}
              title={currentSong?.liked ? "取消喜欢" : "喜欢"}
              aria-label={currentSong?.liked ? "取消喜欢" : "喜欢"}
              onClick={toggleCurrentSongLiked}
              disabled={!currentSong}
            >
              <Heart fill={currentSong?.liked ? "currentColor" : "none"} />
            </button>
            <button
              className="icon-button icon-button--compact"
              title="添加到歌单"
              aria-label="添加到歌单"
              onClick={() => currentSong && setPlaylistCandidate(currentSong)}
              disabled={!currentSong}
            >
              <ListMusic />
            </button>
          </div>
          <input
            aria-label="播放进度"
            type="range"
            min="0"
            max={player.duration || 0}
            step="0.1"
            value={Math.min(shownTime, player.duration || 0)}
            onChange={(event) => setScrubTime(Number(event.target.value))}
            onPointerUp={commitSeek}
            onKeyUp={(event) => void player.seekTo(Number(event.currentTarget.value))}
            style={{ "--progress": `${progress}%` } as React.CSSProperties}
          />
          <span>{formatTime(player.duration)}</span>
        </div>
      </div>

      <div className="player-bar__tools">
        <button
          className={`icon-button ${desktopLyrics.enabled ? "is-accent" : ""}`}
          title={desktopLyrics.enabled ? "关闭桌面歌词" : "打开桌面歌词"}
          onClick={() => void desktopLyrics.setEnabled(!desktopLyrics.enabled)}
        >
          <PanelTopOpen />
        </button>
        <button
          className={`icon-button ${player.playMode !== "sequence" ? "is-accent" : ""}`}
          title={modeLabels[player.playMode]}
          aria-label={modeLabels[player.playMode]}
          onClick={player.togglePlayMode}
        >
          <ModeIcon />
        </button>
        <button
          className="icon-button"
          title="歌词页"
          onClick={() => navigate("/now-playing")}
          disabled={!player.currentSong}
        >
          <Mic2 />
        </button>
        <div className="volume">
          {player.volume < 0.5 ? <Volume1 /> : <Volume2 />}
          <input
            aria-label="音量"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={player.volume}
            onChange={(event) => player.setVolume(Number(event.target.value))}
            style={{ "--progress": `${player.volume * 100}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </footer>
    {playlistCandidate && <AddToPlaylistModal song={playlistCandidate} onClose={() => setPlaylistCandidate(null)} />}
    </>
  );
}
