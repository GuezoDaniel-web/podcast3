import { Link } from 'react-router-dom';
import { IconMic } from './Icons';

const COLUMNS = [
  {
    title: 'Listen',
    links: [
      { label: 'Discover shows', to: '/' },
      { label: 'Your favourites', to: '/favorites' },
      { label: 'Listening history', to: '/history' },
    ],
  },
  {
    title: 'Genres',
    items: ['True crime', 'Comedy', 'History', 'Business'],
  },
  {
    title: 'About',
    items: ['Built with React + Vite', 'Data by podcast-api', 'Open source'],
  },
];

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer__top">
        <div>
          <Link to="/" className="brand">
            <span className="brand__mark" aria-hidden="true">
              <IconMic size={18} />
            </span>
            <span className="brand__name">
              Alexandria<em>.fm</em>
            </span>
          </Link>
          <p className="footer__blurb">
            A quiet, fast library for the shows you actually finish. Browse,
            preview and keep every episode in one place.
          </p>
        </div>

        <div className="footer__cols">
          {COLUMNS.map((col) => (
            <div className="footer__col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links
                  ? col.links.map((link) => (
                      <li key={link.label}>
                        <Link to={link.to}>{link.label}</Link>
                      </li>
                    ))
                  : col.items.map((item) => (
                      <li key={item}>
                        <span>{item}</span>
                      </li>
                    ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} Podcast of Alexandria</span>
        <span>Audio streamed directly from each publisher.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
