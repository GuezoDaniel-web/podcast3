import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import ShowCarousel from './Carousel';
import {
  IconAlert,
  IconArrowRight,
  IconClose,
  IconPlay,
  IconSearch,
} from './Icons';
import {
  GENRE_LIST,
  SORT_OPTIONS,
  formatRelative,
  genreNames,
  plural,
  sortShows,
} from './lib';

const PAGE_SIZE = 24;

const ShowCardSkeleton = () => (
  <div className="card" aria-hidden="true">
    <div className="skeleton skeleton--art" />
    <div className="skeleton skeleton--line" />
    <div className="skeleton skeleton--line is-short" />
  </div>
);

const ShowCard = ({ show }) => {
  const navigate = useNavigate();
  const genres = genreNames(show.genres);

  return (
    <article className="card">
      <div className="card__art">
        <Link to={`/show/${show.id}`} tabIndex={-1} aria-hidden="true">
          <img src={show.image} alt="" loading="lazy" />
        </Link>
        <span className="card__badge">{plural(show.seasons, 'season')}</span>
        <button
          type="button"
          className="card__play"
          onClick={() => navigate(`/show/${show.id}`)}
          aria-label={`Open ${show.title}`}
        >
          <IconPlay size={18} />
        </button>
      </div>
      <h3 className="card__title">
        <Link to={`/show/${show.id}`}>{show.title}</Link>
      </h3>
      <p className="card__desc">{show.description}</p>
      <div className="card__meta">
        {genres.slice(0, 2).map((genre) => (
          <span className="chip" key={genre}>
            {genre}
          </span>
        ))}
        <span className="card__updated">{formatRelative(show.updated)}</span>
      </div>
    </article>
  );
};

ShowCard.propTypes = { show: PropTypes.object.isRequired };

const Pagination = ({ page, pageCount, onChange }) => {
  if (pageCount <= 1) return null;

  // Compact window of pages around the current one.
  const pages = [];
  const push = (value) => pages.push(value);
  push(1);
  for (let i = page - 1; i <= page + 1; i += 1) {
    if (i > 1 && i < pageCount) push(i);
  }
  if (pageCount > 1) push(pageCount);
  const unique = [...new Set(pages)].sort((a, b) => a - b);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        Previous
      </button>
      {unique.map((value, index) => (
        <span key={value} style={{ display: 'contents' }}>
          {index > 0 && unique[index - 1] !== value - 1 && (
            <span className="pagination__gap">…</span>
          )}
          <button
            type="button"
            className={value === page ? 'is-active' : undefined}
            onClick={() => onChange(value)}
            aria-current={value === page ? 'page' : undefined}
          >
            {value}
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
      >
        Next
      </button>
    </nav>
  );
};

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

const Home = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('az');
  const [genreId, setGenreId] = useState(0);
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    axios
      .get('https://podcast-api.netlify.app/shows', { signal: controller.signal })
      .then((response) => {
        setShows(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel?.(err) || err.name === 'CanceledError') return;
        console.error('Error fetching show data:', err);
        setError('We could not reach the podcast library. Check your connection and try again.');
        setLoading(false);
      });

    return () => controller.abort();
  }, [reloadToken]);

  // Reset to the first page whenever the result set changes underneath us.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortOption, genreId]);

  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = shows.filter((show) => {
      const matchesTerm =
        !term ||
        show.title?.toLowerCase().includes(term) ||
        show.description?.toLowerCase().includes(term);
      const matchesGenre =
        !genreId || (Array.isArray(show.genres) && show.genres.includes(genreId));
      return matchesTerm && matchesGenre;
    });
    return sortShows(filtered, sortOption);
  }, [shows, searchTerm, genreId, sortOption]);

  const featured = useMemo(
    () => sortShows(shows, 'newest').slice(0, 12),
    [shows]
  );

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const isFiltered = Boolean(searchTerm.trim()) || genreId !== 0;

  const changePage = (next) => {
    setPage(Math.min(Math.max(1, next), pageCount));
    document
      .getElementById('catalogue')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <section className="hero">
        <span className="hero__glow hero__glow--a" aria-hidden="true" />
        <span className="hero__glow hero__glow--b" aria-hidden="true" />
        <span className="hero__grid" aria-hidden="true" />
        <div className="container hero__inner">
          <span className="eyebrow">The library of Alexandria, for audio</span>
          <h1>
            Every show worth hearing,{' '}
            <span className="grad-text">in one calm place.</span>
          </h1>
          <p className="lede">
            Search thousands of series, preview any season before you commit and
            keep the episodes you love. No feeds to wrangle, no clutter.
          </p>
          <div className="hero__cta">
            <a className="btn btn--primary" href="#catalogue">
              Browse the library
              <IconArrowRight size={18} />
            </a>
            <Link className="btn btn--ghost" to="/favorites">
              Your favourites
            </Link>
          </div>
          <div className="hero__stats">
            <div>
              <div className="stat__value">
                {loading ? '—' : shows.length.toLocaleString()}
              </div>
              <div className="stat__label">Shows indexed</div>
            </div>
            <div>
              <div className="stat__value">{GENRE_LIST.length}</div>
              <div className="stat__label">Genres</div>
            </div>
            <div>
              <div className="stat__value">Free</div>
              <div className="stat__label">Always, no account fees</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--raised" id="catalogue">
        <div className="container">
          {!loading && !error && featured.length > 0 && (
            <div style={{ marginBottom: '56px' }}>
              <ShowCarousel
                shows={featured}
                title="Freshly updated"
                subtitle="Series that published something new most recently"
              />
            </div>
          )}

          <div className="section-head">
            <div>
              <h2>Browse the catalogue</h2>
              <p>Filter by genre, search by title or description, sort it your way.</p>
            </div>
          </div>

          <div className="toolbar">
            <div className="search">
              <span className="search__icon">
                <IconSearch size={18} />
              </span>
              <input
                className="input"
                type="search"
                placeholder="Search shows and descriptions…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search shows"
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
              value={genreId}
              onChange={(event) => setGenreId(Number(event.target.value))}
              aria-label="Filter by genre"
            >
              <option value={0}>All genres</option>
              {GENRE_LIST.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.title}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
              aria-label="Sort shows"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="genre-rail" role="group" aria-label="Quick genre filter">
            <button
              type="button"
              className={`genre-rail__item${genreId === 0 ? ' is-active' : ''}`}
              onClick={() => setGenreId(0)}
            >
              All
            </button>
            {GENRE_LIST.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className={`genre-rail__item${
                  genreId === genre.id ? ' is-active' : ''
                }`}
                onClick={() => setGenreId(genre.id)}
              >
                {genre.title}
              </button>
            ))}
          </div>

          {error ? (
            <div className="alert">
              <IconAlert />
              <div>
                <div className="alert__title">Something went wrong</div>
                <p>{error}</p>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  style={{ marginTop: '14px' }}
                  onClick={() => setReloadToken((token) => token + 1)}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="grid">
              {Array.from({ length: 12 }, (_, index) => (
                <ShowCardSkeleton key={index} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="empty">
              <div className="empty__icon">
                <IconSearch size={26} />
              </div>
              <h3>No shows match that</h3>
              <p>
                Try a different search term, or clear the genre filter to see the
                whole library again.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setSearchTerm('');
                  setGenreId(0);
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              <div className="toolbar__meta">
                <span>
                  {results.length.toLocaleString()}{' '}
                  {results.length === 1 ? 'show' : 'shows'}
                  {isFiltered ? ' found' : ' in the library'}
                  {pageCount > 1 && ` · page ${safePage} of ${pageCount}`}
                </span>
                {isFiltered && (
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                      setSearchTerm('');
                      setGenreId(0);
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="grid">
                {visible.map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>

              <Pagination
                page={safePage}
                pageCount={pageCount}
                onChange={changePage}
              />
            </>
          )}
        </div>
      </section>

      <section className="section section--tight section--light cta-band">
        <div className="container">
          <h2>Start a queue you will actually finish.</h2>
          <p>
            Favourite an episode from any season and it waits for you — with your
            place in it saved, on every visit.
          </p>
          <Link className="btn btn--primary" to="/favorites">
            Open your favourites
            <IconArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
