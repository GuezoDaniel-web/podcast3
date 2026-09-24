import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { IconClose, IconMenu, IconMic, IconSignOut } from './Icons';

const LINKS = [
  { to: '/', label: 'Discover', end: true },
  { to: '/favorites', label: 'Favourites', badge: true },
  { to: '/history', label: 'History' },
];

const Navbar = ({ user = null, favoriteCount = 0, onSignOut }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  const initial = user?.email?.[0] ?? '?';

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container nav__inner">
        <NavLink to="/" className="brand" aria-label="Podcast of Alexandria, home">
          <span className="brand__mark" aria-hidden="true">
            <IconMic size={18} />
          </span>
          <span className="brand__name">
            Alexandria<em>.fm</em>
          </span>
        </NavLink>

        <nav
          id="primary-navigation"
          className={`nav__links${menuOpen ? ' is-open' : ''}`}
        >
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `nav__link${isActive ? ' is-active' : ''}`
              }
            >
              {link.label}
              {link.badge && favoriteCount > 0 && (
                <span className="nav__count">{favoriteCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="nav__actions">
          <span className="nav__user" title={user?.email}>
            <span className="nav__avatar" aria-hidden="true">
              {initial}
            </span>
            <span className="nav__email">{user?.email}</span>
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onSignOut}
          >
            <IconSignOut size={16} />
            Sign out
          </button>
          <button
            type="button"
            className="nav__burger"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>
    </header>
  );
};

Navbar.propTypes = {
  user: PropTypes.shape({ email: PropTypes.string }),
  favoriteCount: PropTypes.number,
  onSignOut: PropTypes.func.isRequired,
};

export default Navbar;
