import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  IconClose,
  IconHeart,
  IconPause,
  IconPlay,
  IconSearch,
  IconTrash,
} from './Icons';
import { formatDate, plural } from './lib';

const SORTS = [
  { value: 'recent', label: 'Recently added' },
  { value: 'oldest', label: 'First added' },
  { value: 'az', label: 'Title A–Z' },
  { value: 'za', label: 'Title Z–A' },
  { value: 'show', label: 'Group by show' },
];

const Favorite = ({
  favorites,
  onRemove,
  onClearAll,
  playEpisode,
  nowPlayingKey,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('recent');
  const [confirmingClear, setConfirmingClear] = useState(false);

  const visible = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = favorites.filter(
      (episode) =>
        !term ||
        episode.title?.toLowerCase().includes(term) ||
        episode.showTitle?.toLowerCase().includes(term)
    );

    const sorted = [...filtered];
    switch (sortOrder) {
      case 'oldest':
        return sorted.sort(
          (a, b) => new Date(a.addedAt) - new Date(b.addedAt)
        );
      case 'az':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'za':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'show':
        return sorted.sort(
          (a, b) =>
            a.showTitle.localeCompare(b.showTitle) ||
            a.season - b.season ||
            a.title.localeCompare(b.title)
        );
      case 'recent':
      default:
        return sorted.sort(
          (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
        );
    }
  }, [favorites, searchTerm, sortOrder]);

  const showCount = useMemo(
    () => new Set(favorites.map((episode) => episode.showId)).size,
    [favorites]
  );

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Your library</span>
            <h2>Favourites</h2>
            <p>
              {favorites.length === 0
                ? 'Episodes you save from any show land here.'
                : `${plural(favorites.length, 'episode')} across ${plural(
                    showCount,
                    'show'
                  )}.`}
            </p>
          </div>
          {favorites.length > 0 &&
            (confirmingClear ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className="stat__label">Remove everything?</span>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => {
                    onClearAll();
                    setConfirmingClear(false);
                  }}
                >
                  Yes, clear
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setConfirmingClear(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setConfirmingClear(true)}
              >
                <IconTrash size={16} />
                Clear all
              </button>
            ))}
        </div>

        {favorites.length === 0 ? (
          <div className="empty">
            <div className="empty__icon">
              <IconHeart size={26} />
            </div>
            <h3>Nothing saved yet</h3>
            <p>
              Open any show, find an episode you like and tap the heart. It will
              be waiting here next time.
            </p>
            <Link className="btn btn--primary" to="/">
              Discover shows
            </Link>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <div className="search">
                <span className="search__icon">
                  <IconSearch size={18} />
                </span>
                <input
                  className="input"
                  type="search"
                  placeholder="Search your favourites…"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Search favourites"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search__clear"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                  >
                    <IconClose size={14} />
                  </button>
                )}
              </div>
              <select
                className="select"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                aria-label="Sort favourites"
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {visible.length === 0 ? (
              <div className="empty">
                <div className="empty__icon">
                  <IconSearch size={26} />
                </div>
                <h3>No favourites match that search</h3>
                <p>Try another title, or clear the search box.</p>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setSearchTerm('')}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <ul className="rows">
                {visible.map((episode) => {
                  const isPlaying = nowPlayingKey === episode.key;
                  return (
                    <li key={episode.key} className="row">
                      <img
                        className="row__art"
                        src={episode.showImage}
                        alt=""
                        loading="lazy"
                      />
                      <div className="row__body">
                        <div className="row__title">{episode.title}</div>
                        <div className="row__sub">
                          <Link to={`/show/${episode.showId}`}>
                            {episode.showTitle}
                          </Link>
                          <span className="dot-sep">Season {episode.season}</span>
                          <span className="dot-sep">
                            Added {formatDate(episode.addedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="row__actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => playEpisode(episode)}
                          aria-label={`Play ${episode.title}`}
                        >
                          {isPlaying ? <IconPause /> : <IconPlay />}
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => onRemove(episode.key)}
                          aria-label={`Remove ${episode.title} from favourites`}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
};

Favorite.propTypes = {
  favorites: PropTypes.array.isRequired,
  onRemove: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired,
  playEpisode: PropTypes.func.isRequired,
  nowPlayingKey: PropTypes.string,
};

export default Favorite;
