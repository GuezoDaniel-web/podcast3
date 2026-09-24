/* Inline SVG icon set — no icon dependency, inherits currentColor. */
import PropTypes from 'prop-types';

const Svg = ({ size = 20, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

Svg.propTypes = { size: PropTypes.number, children: PropTypes.node };

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Svg>
);

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const IconPlay = ({ size = 20, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" stroke="none" />
  </Svg>
);

IconPlay.propTypes = { size: PropTypes.number };

export const IconPause = ({ size = 20, ...p }) => (
  <Svg size={size} {...p}>
    <rect x="6.5" y="5" width="4" height="14" rx="1.4" fill="currentColor" stroke="none" />
    <rect x="13.5" y="5" width="4" height="14" rx="1.4" fill="currentColor" stroke="none" />
  </Svg>
);

IconPause.propTypes = { size: PropTypes.number };

export const IconHeart = ({ filled = false, ...p }) => (
  <Svg {...p}>
    <path
      d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 7.5 3.4c0 5-7.5 9.6-7.5 9.6Z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </Svg>
);

IconHeart.propTypes = { filled: PropTypes.bool };

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M10 7V5h4v2M6 7l1 12h10l1-12" />
  </Svg>
);

export const IconArrowLeft = (p) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

export const IconArrowRight = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const IconChevronLeft = (p) => (
  <Svg {...p}>
    <path d="m14 6-6 6 6 6" />
  </Svg>
);

export const IconChevronRight = (p) => (
  <Svg {...p}>
    <path d="m10 6 6 6-6 6" />
  </Svg>
);

export const IconBack15 = (p) => (
  <Svg {...p}>
    <path d="M12 5a7 7 0 1 1-6.6 4.7" />
    <path d="M4.6 4.5v4.8h4.8" />
    <text
      x="12"
      y="15.5"
      textAnchor="middle"
      fontSize="7"
      fontWeight="700"
      fill="currentColor"
      stroke="none"
      fontFamily="inherit"
    >
      15
    </text>
  </Svg>
);

export const IconFwd15 = (p) => (
  <Svg {...p}>
    <path d="M12 5a7 7 0 1 0 6.6 4.7" />
    <path d="M19.4 4.5v4.8h-4.8" />
    <text
      x="12"
      y="15.5"
      textAnchor="middle"
      fontSize="7"
      fontWeight="700"
      fill="currentColor"
      stroke="none"
      fontFamily="inherit"
    >
      15
    </text>
  </Svg>
);

export const IconVolume = (p) => (
  <Svg {...p}>
    <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
    <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" />
  </Svg>
);

export const IconMute = (p) => (
  <Svg {...p}>
    <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
    <path d="m16 10 4 4M20 10l-4 4" />
  </Svg>
);

export const IconMic = (p) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Svg>
);

export const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconMenu = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconCheck = ({ size = 14, ...p }) => (
  <Svg size={size} strokeWidth="2.4" {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);

IconCheck.propTypes = { size: PropTypes.number };

export const IconAlert = ({ size = 22, ...p }) => (
  <Svg size={size} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v4.5M12 16h.01" />
  </Svg>
);

IconAlert.propTypes = { size: PropTypes.number };

export const IconSparkle = ({ size = 26, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 4l1.9 4.9L19 10.8l-5.1 1.9L12 17.6l-1.9-4.9L5 10.8l5.1-1.9L12 4Z" />
  </Svg>
);

IconSparkle.propTypes = { size: PropTypes.number };

export const IconEye = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M9.9 5.8A8.7 8.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.5 16.5 0 0 1-3 3.8M6.5 8.2A16.4 16.4 0 0 0 2.5 12S6 18.5 12 18.5a8.9 8.9 0 0 0 3.3-.63" />
    <path d="M10 10a3 3 0 0 0 4 4M3.5 3.5l17 17" />
  </Svg>
);

export const IconSignOut = (p) => (
  <Svg {...p}>
    <path d="M15 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v2" />
    <path d="M19 12H9m7-4 4 4-4 4" />
  </Svg>
);
