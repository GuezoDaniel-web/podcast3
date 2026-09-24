import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { IconChevronLeft, IconChevronRight } from './Icons';
import { formatRelative, genreNames, plural } from './lib';

/**
 * Scroll-snap rail of featured shows. Built on native overflow scrolling so it
 * needs no carousel dependency and stays keyboard/touch friendly.
 */
const ShowCarousel = ({ shows, title, subtitle }) => {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    sync();
    const el = trackRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync, shows]);

  const scrollBy = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * (el.clientWidth * 0.8), behavior: 'smooth' });
  };

  if (!shows.length) return null;

  return (
    <section className="rail" aria-label={title}>
      <div className="rail__head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="stat__label">{subtitle}</p>}
        </div>
        <div className="rail__nav">
          <button
            type="button"
            className="icon-btn"
            onClick={() => scrollBy(-1)}
            disabled={atStart}
            aria-label="Scroll left"
          >
            <IconChevronLeft />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => scrollBy(1)}
            disabled={atEnd}
            aria-label="Scroll right"
          >
            <IconChevronRight />
          </button>
        </div>
      </div>

      <ul className="rail__track" ref={trackRef}>
        {shows.map((show) => {
          const genres = genreNames(show.genres);
          return (
            <li key={show.id}>
              <Link to={`/show/${show.id}`} className="feature">
                <img src={show.image} alt="" loading="lazy" />
                <span className="feature__body">
                  {genres[0] && <span className="chip chip--violet">{genres[0]}</span>}
                  <span className="feature__title">{show.title}</span>
                  <span className="feature__meta">
                    {plural(show.seasons, 'season')} · Updated{' '}
                    {formatRelative(show.updated)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

ShowCarousel.propTypes = {
  shows: PropTypes.array.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

export default ShowCarousel;
