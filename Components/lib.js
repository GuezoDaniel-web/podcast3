// Shared data + formatting helpers.

// The /shows endpoint returns genres as numeric ids; only /genre/:id returns
// titles. Mapping them here keeps the catalogue filterable without N requests.
export const GENRES = {
  1: 'Personal Growth',
  2: 'Investigative Journalism',
  3: 'History',
  4: 'Comedy',
  5: 'Entertainment',
  6: 'Business',
  7: 'Fiction',
  8: 'News',
  9: 'Kids and Family',
};

export const GENRE_LIST = Object.entries(GENRES).map(([id, title]) => ({
  id: Number(id),
  title,
}));

export const genreNames = (ids) =>
  Array.isArray(ids) ? ids.map((id) => GENRES[id]).filter(Boolean) : [];

export const SORT_OPTIONS = [
  { value: 'az', label: 'Title A–Z' },
  { value: 'za', label: 'Title Z–A' },
  { value: 'newest', label: 'Recently updated' },
  { value: 'oldest', label: 'Least recently updated' },
];

export function sortShows(shows, option) {
  const sorted = [...shows];
  switch (option) {
    case 'za':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'newest':
      return sorted.sort((a, b) => new Date(b.updated) - new Date(a.updated));
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.updated) - new Date(b.updated));
    case 'az':
    default:
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelative(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diffDays = Math.round((Date.now() - date.getTime()) / 86400000);
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)} months ago`;
  return `${Math.round(diffDays / 365)} years ago`;
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

export function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// Stable identity for an episode across the shows/seasons/episodes tree — the
// API gives episodes no id of their own.
export function episodeKey(showId, seasonNumber, episodeTitle) {
  return `${showId}::${seasonNumber}::${episodeTitle}`;
}

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — non-fatal */
  }
}

/* -------------------------------------------------------------- session -- */

const SESSION_KEY = 'poa:user';

/**
 * "Keep me signed in" decides *where* the session lives:
 *   localStorage   — survives closing the browser
 *   sessionStorage — cleared when the tab closes
 * Read checks both so either choice is picked up on boot.
 */
export function readSession() {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSession(user) {
  try {
    const store = user.remember ? localStorage : sessionStorage;
    const other = user.remember ? sessionStorage : localStorage;
    other.removeItem(SESSION_KEY);
    store.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    /* non-fatal */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* non-fatal */
  }
}

/* ---------------------------------------------------------- credentials -- */

const REMEMBERED_EMAIL_KEY = 'poa:remembered-email';

export const readRememberedEmail = () => {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
  } catch {
    return '';
  }
};

export const saveRememberedEmail = (email) => {
  try {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  } catch {
    /* non-fatal */
  }
};

export const forgetRememberedEmail = () => {
  try {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    /* non-fatal */
  }
};

// Passwords belong in the browser's credential store, not in app storage —
// there they are encrypted at rest, synced, and unreachable from page scripts.
export const hasCredentialManager = () =>
  typeof window !== 'undefined' &&
  'credentials' in navigator &&
  'PasswordCredential' in window;

/** Ask the browser to remember this email/password pair. */
export async function storeCredential(email, password) {
  if (!hasCredentialManager()) return false;
  try {
    const credential = new window.PasswordCredential({
      id: email,
      password,
      name: email,
    });
    await navigator.credentials.store(credential);
    return true;
  } catch {
    return false;
  }
}

/** Offer any saved credential back, without forcing a prompt. */
export async function requestCredential() {
  if (!hasCredentialManager()) return null;
  try {
    const credential = await navigator.credentials.get({
      password: true,
      mediation: 'optional',
    });
    return credential?.password ? credential : null;
  } catch {
    return null;
  }
}

/** Stop the browser auto-filling after an explicit sign-out. */
export async function releaseCredentials() {
  try {
    await navigator.credentials?.preventSilentAccess?.();
  } catch {
    /* non-fatal */
  }
}
