import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  IconBack15,
  IconClose,
  IconFwd15,
  IconHeart,
  IconMute,
  IconPause,
  IconPlay,
  IconVolume,
} from './Icons';
import { formatTime, readJSON, writeJSON } from './lib';

const SAVE_EVERY_SECONDS = 5;
const VOLUME_KEY = 'poa:volume';

/**
 * Single, app-wide audio surface. Only one episode can play at a time, progress
 * is persisted while listening, and closing the tab mid-episode asks first.
 */
const Player = ({
  episode,
  resumeAt,
  isFavorite,
  onToggleFavorite,
  onProgress,
  onClose,
}) => {
  const audioRef = useRef(null);
  const lastSavedRef = useRef(0);
  // Keep the latest values reachable from listeners without re-binding them.
  const episodeRef = useRef(episode);
  const onProgressRef = useRef(onProgress);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => readJSON(VOLUME_KEY, 1));
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);

  episodeRef.current = episode;
  onProgressRef.current = onProgress;

  const save = useCallback((completed = false) => {
    const audio = audioRef.current;
    if (!audio || !episodeRef.current) return;
    onProgressRef.current(
      episodeRef.current,
      completed ? 0 : audio.currentTime,
      audio.duration,
      completed
    );
    lastSavedRef.current = audio.currentTime;
  }, []);

  /* Load a new episode, resume where we left off, then start playing. */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    setError(false);
    setCurrentTime(0);
    setDuration(0);
    lastSavedRef.current = 0;

    const startAt = resumeAt > 3 ? resumeAt : 0;
    const onLoaded = () => {
      setDuration(audio.duration || 0);
      if (startAt && startAt < (audio.duration || Infinity)) {
        audio.currentTime = startAt;
        setCurrentTime(startAt);
      }
      audio.play().catch(() => setPlaying(false));
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.load();

    return () => audio.removeEventListener('loadedmetadata', onLoaded);
    // `resumeAt` is intentionally read once per episode, not tracked live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.key]);

  /* Persist volume and mirror it onto the element. */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = muted;
    }
    writeJSON(VOLUME_KEY, volume);
  }, [volume, muted]);

  /* Save progress on unmount so closing the player never loses a position. */
  useEffect(() => () => save(), [save]);

  /* Guard against losing progress on an accidental tab close. */
  useEffect(() => {
    const onBeforeUnload = (event) => {
      save();
      if (!playing) return undefined;
      event.preventDefault();
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [playing, save]);

  /* Space toggles playback unless the user is typing. */
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code !== 'Space') return;
      const tag = event.target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        tag === 'BUTTON' ||
        event.target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setError(true));
    else audio.pause();
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(
      0,
      Math.min(audio.duration || 0, audio.currentTime + seconds)
    );
    setCurrentTime(audio.currentTime);
  };

  const seek = (value) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (Math.abs(audio.currentTime - lastSavedRef.current) >= SAVE_EVERY_SECONDS) {
      save();
    }
  };

  const handleClose = () => {
    save();
    onClose();
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player" role="region" aria-label="Audio player">
      <audio
        ref={audioRef}
        src={episode.file}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          save();
        }}
        onEnded={() => {
          setPlaying(false);
          save(true);
        }}
        onDurationChange={(event) => setDuration(event.target.duration || 0)}
        onTimeUpdate={handleTimeUpdate}
        onError={() => {
          setError(true);
          setPlaying(false);
        }}
      />

      <div className="container player__inner">
        <div className="player__now">
          <img className="player__art" src={episode.showImage} alt="" />
          <div className="player__text">
            <div className="player__title">{episode.title}</div>
            <div className="player__show">
              {error
                ? 'This episode could not be streamed'
                : `${episode.showTitle} · Season ${episode.season}`}
            </div>
          </div>
          <button
            type="button"
            className={`icon-btn${isFavorite ? ' is-active' : ''}`}
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={
              isFavorite ? 'Remove from favourites' : 'Add to favourites'
            }
          >
            <IconHeart filled={isFavorite} size={18} />
          </button>
        </div>

        <div className="player__controls">
          <div className="player__buttons">
            <button
              type="button"
              className="icon-btn"
              onClick={() => skip(-15)}
              aria-label="Back 15 seconds"
            >
              <IconBack15 />
            </button>
            <button
              type="button"
              className="player__play"
              onClick={toggle}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <IconPause size={18} /> : <IconPlay size={18} />}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => skip(15)}
              aria-label="Forward 15 seconds"
            >
              <IconFwd15 />
            </button>
          </div>

          <div className="player__scrub">
            <span>{formatTime(currentTime)}</span>
            <input
              className="range"
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={currentTime}
              onChange={(event) => seek(Number(event.target.value))}
              style={{ '--fill': `${progressPct}%` }}
              aria-label="Seek"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player__extras">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMuted((value) => !value)}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted || volume === 0 ? <IconMute size={18} /> : <IconVolume size={18} />}
          </button>
          <input
            className="range player__volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(event) => {
              setVolume(Number(event.target.value));
              setMuted(false);
            }}
            style={{ '--fill': `${(muted ? 0 : volume) * 100}%` }}
            aria-label="Volume"
          />
          <button
            type="button"
            className="icon-btn"
            onClick={handleClose}
            aria-label="Close player"
          >
            <IconClose size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

Player.propTypes = {
  episode: PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    showTitle: PropTypes.string,
    showImage: PropTypes.string,
    season: PropTypes.number,
    file: PropTypes.string,
  }).isRequired,
  resumeAt: PropTypes.number,
  isFavorite: PropTypes.bool,
  onToggleFavorite: PropTypes.func.isRequired,
  onProgress: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Player;
