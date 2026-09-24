import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  IconCheck,
  IconClock,
  IconPause,
  IconPlay,
  IconTrash,
} from './Icons';
import { formatRelative, formatTime, plural } from './lib';

const History = ({ progress, onReset, onRemove, playEpisode, nowPlayingKey }) => {
  const [confirmingReset, setConfirmingReset] = useState(false);

  const entries = useMemo(
    () =>
      Object.values(progress ?? {}).sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      ),
    [progress]
  );

  const inProgress = entries.filter(
    (entry) => !entry.completed && entry.position > 5
  );
  const completedCount = entries.filter((entry) => entry.completed).length;
  const totalSeconds = entries.reduce(
    (total, entry) => total + (entry.position || 0),
    0
  );

  const renderRow = (entry) => {
    const isPlaying = nowPlayingKey === entry.key;
    const pct =
      entry.duration > 0
        ? Math.min(100, Math.round((entry.position / entry.duration) * 100))
        : 0;

    return (
      <li key={entry.key} className="row">
        <img className="row__art" src={entry.showImage} alt="" loading="lazy" />
        <div className="row__body">
          <div className="row__title">{entry.title}</div>
          <div className="row__sub">
            <Link to={`/show/${entry.showId}`}>{entry.showTitle}</Link>
            <span className="dot-sep">Season {entry.season}</span>
            <span className="dot-sep">{formatRelative(entry.updatedAt)}</span>
          </div>
          <div className="row__sub" style={{ marginTop: 6 }}>
            {entry.completed ? (
              <span className="chip chip--violet">
                <IconCheck size={12} /> Finished
              </span>
            ) : (
              <span className="chip">
                {formatTime(entry.position)}
                {entry.duration ? ` of ${formatTime(entry.duration)}` : ''}
                {pct ? ` · ${pct}%` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="row__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => playEpisode(entry)}
            aria-label={`${entry.completed ? 'Replay' : 'Resume'} ${entry.title}`}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onRemove(entry.key)}
            aria-label={`Remove ${entry.title} from history`}
          >
            <IconTrash />
          </button>
        </div>
      </li>
    );
  };

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Your library</span>
            <h2>Listening history</h2>
            <p>
              {entries.length === 0
                ? 'Play anything and your place in it is remembered here.'
                : `${plural(entries.length, 'episode')} tracked · ${completedCount} finished · ${formatTime(
                    totalSeconds
                  )} listened.`}
            </p>
          </div>
          {entries.length > 0 &&
            (confirmingReset ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className="stat__label">Reset all progress?</span>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => {
                    onReset();
                    setConfirmingReset(false);
                  }}
                >
                  Yes, reset
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setConfirmingReset(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setConfirmingReset(true)}
              >
                <IconTrash size={16} />
                Reset progress
              </button>
            ))}
        </div>

        {entries.length === 0 ? (
          <div className="empty">
            <div className="empty__icon">
              <IconClock size={26} />
            </div>
            <h3>No listening history yet</h3>
            <p>
              Press play on any episode. We remember where you stopped so you can
              pick it back up later.
            </p>
            <Link className="btn btn--primary" to="/">
              Find something to play
            </Link>
          </div>
        ) : (
          <>
            {inProgress.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <h3 style={{ marginBottom: 18 }}>Continue listening</h3>
                <ul className="rows">{inProgress.slice(0, 4).map(renderRow)}</ul>
              </div>
            )}

            <h3 style={{ marginBottom: 18 }}>Everything you have played</h3>
            <ul className="rows">{entries.map(renderRow)}</ul>
          </>
        )}
      </div>
    </section>
  );
};

History.propTypes = {
  progress: PropTypes.object,
  onReset: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  playEpisode: PropTypes.func.isRequired,
  nowPlayingKey: PropTypes.string,
};

export default History;
