import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import {
  IconAlert,
  IconArrowLeft,
  IconHeart,
  IconPause,
  IconPlay,
} from './Icons';
import { episodeKey, formatTime, plural } from './lib';

const EpisodeSkeleton = () => (
  <div className="episode" aria-hidden="true">
    <div className="skeleton" style={{ width: 46, height: 46, borderRadius: '50%' }} />
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="skeleton skeleton--line" style={{ width: '45%' }} />
      <div className="skeleton skeleton--line is-short" />
    </div>
    <div />
  </div>
);

const Preview = ({
  favoriteKeys,
  toggleFavorite,
  playEpisode,
  nowPlayingKey,
  progress,
}) => {
  const { showId } = useParams();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seasonNumber, setSeasonNumber] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!showId) return undefined;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setShow(null);
    setSeasonNumber(null);
    setExpanded(false);

    axios
      .get(`https://podcast-api.netlify.app/id/${showId}`, {
        signal: controller.signal,
      })
      .then((response) => {
        setShow(response.data);
        setSeasonNumber(response.data?.seasons?.[0]?.season ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel?.(err) || err.name === 'CanceledError') return;
        console.error('Error fetching podcast data:', err);
        setError('We could not load this show. It may have moved, or the network dropped.');
        setLoading(false);
      });

    return () => controller.abort();
  }, [showId, reloadToken]);

  const seasons = useMemo(
    () => (Array.isArray(show?.seasons) ? show.seasons : []),
    [show]
  );

  const activeSeason =
    seasons.find((season) => season.season === seasonNumber) ?? seasons[0] ?? null;

  const episodeCount = useMemo(
    () =>
      seasons.reduce(
        (total, season) => total + (season.episodes?.length ?? 0),
        0
      ),
    [seasons]
  );

  const buildEpisode = (season, episode) => ({
    key: episodeKey(show.id, season.season, episode.title),
    showId: show.id,
    showTitle: show.title,
    showImage: season.image || show.image,
    season: season.season,
    seasonTitle: season.title,
    title: episode.title,
    description: episode.description,
    file: episode.file,
  });

  const latest = useMemo(() => {
    const lastSeason = seasons[seasons.length - 1];
    const lastEpisode = lastSeason?.episodes?.[0];
    return lastSeason && lastEpisode ? { lastSeason, lastEpisode } : null;
  }, [seasons]);

  /* ---------------------------------------------------------------- views */

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <Link to="/" className="back-link">
            <IconArrowLeft size={16} />
            All shows
          </Link>
          <div style={{ display: 'flex', gap: 32, marginBottom: 44, flexWrap: 'wrap' }}>
            <div
              className="skeleton"
              style={{ width: 200, height: 200, borderRadius: 24 }}
            />
            <div style={{ flex: '1 1 260px', display: 'grid', gap: 14, alignContent: 'center' }}>
              <div className="skeleton skeleton--line" style={{ width: '35%', height: 28 }} />
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--line is-short" />
            </div>
          </div>
          <div className="episode-list">
            {Array.from({ length: 5 }, (_, index) => (
              <EpisodeSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !show) {
    return (
      <section className="section">
        <div className="container">
          <Link to="/" className="back-link">
            <IconArrowLeft size={16} />
            All shows
          </Link>
          <div className="alert">
            <IconAlert />
            <div>
              <div className="alert__title">Show unavailable</div>
              <p>{error ?? 'No data was found for this podcast.'}</p>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{ marginTop: 14 }}
                onClick={() => setReloadToken((token) => token + 1)}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="show-hero">
        <span
          className="show-hero__bg"
          style={{ backgroundImage: `url(${show.image})` }}
          aria-hidden="true"
        />
        <div className="container">
          <Link to="/" className="back-link">
            <IconArrowLeft size={16} />
            All shows
          </Link>

          <div className="show-hero__inner">
            <img className="show-hero__art" src={show.image} alt="" />
            <div>
              <div className="show-hero__meta">
                <span className="chip chip--violet">Podcast</span>
                <span className="chip">{plural(seasons.length, 'season')}</span>
                <span className="chip">{plural(episodeCount, 'episode')}</span>
              </div>
              <h1>{show.title}</h1>
              <p className={`show-hero__desc${expanded ? '' : ' is-clamped'}`}>
                {show.description}
              </p>
              {show.description?.length > 240 && (
                <button
                  type="button"
                  className="linkish"
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}

              <div className="show-hero__actions">
                {latest && (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() =>
                      playEpisode(buildEpisode(latest.lastSeason, latest.lastEpisode))
                    }
                  >
                    <IconPlay size={18} />
                    Play latest episode
                  </button>
                )}
                <Link to="/favorites" className="btn btn--ghost">
                  <IconHeart size={18} />
                  Your favourites
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--raised">
        <div className="container">
          {seasons.length === 0 ? (
            <div className="empty">
              <div className="empty__icon">
                <IconAlert size={26} />
              </div>
              <h3>No seasons published yet</h3>
              <p>This show has not shared any episodes through the API.</p>
              <Link className="btn btn--primary" to="/">
                Back to the library
              </Link>
            </div>
          ) : (
            <>
              <div className="section-head">
                <div>
                  <h2>Episodes</h2>
                  <p>Pick a season, then play or favourite any episode.</p>
                </div>
              </div>

              <div className="season-tabs" role="tablist" aria-label="Seasons">
                {seasons.map((season) => (
                  <button
                    key={season.season}
                    type="button"
                    role="tab"
                    aria-selected={activeSeason?.season === season.season}
                    className={`season-tab${
                      activeSeason?.season === season.season ? ' is-active' : ''
                    }`}
                    onClick={() => setSeasonNumber(season.season)}
                  >
                    <img src={season.image || show.image} alt="" loading="lazy" />
                    <span>
                      Season {season.season}
                      <span style={{ color: 'var(--text-30)' }}>
                        {' '}
                        · {season.episodes?.length ?? 0}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <ul className="episode-list">
                {(activeSeason?.episodes ?? []).map((episode, index) => {
                  const item = buildEpisode(activeSeason, episode);
                  const isFavorite = favoriteKeys.has(item.key);
                  const isPlaying = nowPlayingKey === item.key;
                  const saved = progress?.[item.key];
                  const pct =
                    saved?.duration > 0
                      ? Math.min(100, (saved.position / saved.duration) * 100)
                      : 0;

                  return (
                    <li
                      key={item.key}
                      className={`episode${isPlaying ? ' is-playing' : ''}`}
                    >
                      <button
                        type="button"
                        className="episode__play"
                        onClick={() => playEpisode(item)}
                        aria-label={`${isPlaying ? 'Now playing' : 'Play'} ${episode.title}`}
                      >
                        {isPlaying ? <IconPause size={18} /> : <IconPlay size={18} />}
                      </button>

                      <div className="episode__body">
                        <div className="episode__num">
                          Episode {index + 1}
                          {saved?.completed && ' · Played'}
                        </div>
                        <div className="episode__title">{episode.title}</div>
                        <p className="episode__desc">{episode.description}</p>
                      </div>

                      <div className="episode__actions">
                        <button
                          type="button"
                          className={`icon-btn${isFavorite ? ' is-active' : ''}`}
                          onClick={() => toggleFavorite(item)}
                          aria-pressed={isFavorite}
                          aria-label={
                            isFavorite
                              ? `Remove ${episode.title} from favourites`
                              : `Add ${episode.title} to favourites`
                          }
                        >
                          <IconHeart filled={isFavorite} />
                        </button>
                      </div>

                      {pct > 0 && !saved?.completed && (
                        <div
                          className="episode__progress"
                          title={`${formatTime(saved.position)} listened`}
                        >
                          <span style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  );
};

Preview.propTypes = {
  favoriteKeys: PropTypes.instanceOf(Set).isRequired,
  toggleFavorite: PropTypes.func.isRequired,
  playEpisode: PropTypes.func.isRequired,
  nowPlayingKey: PropTypes.string,
  progress: PropTypes.object,
};

export default Preview;
