# Podcast of Alexandria

A podcast browser built with React + Vite. Search a catalogue of thousands of
shows, preview any season before committing, play episodes from a single
app-wide player, and keep your favourites and listening progress between visits.

- **Discover** — search, filter by genre and sort the whole catalogue
- **Preview** — every season and episode of a show, with resume markers
- **Favourites** — save individual episodes, not just whole shows
- **History** — where you stopped in each episode, and what you finished
- **Player** — one persistent player with resume, skip, seek and volume
- **Login** — with "keep me signed in" and password-manager support

---

## Quick start

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open the URL Vite prints — usually <http://localhost:5173>. If that port is
already taken, pass another one (works on any shell):

```bash
npm run dev -- --port 3000
```

On the login screen you can enter any email and password (6+ characters) and
press **Sign in** to go straight into the app — no account needed unless you
configure Supabase (see [Environment](#environment)).

### All scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Produce a production bundle in `dist/` |
| `npm run preview` | Serve the built bundle locally to check it |
| `npm run lint` | ESLint across the project (`--max-warnings 0`) |

---

## How logging in works

The login page lives at `/login`. Visiting any other route while signed out
redirects there and remembers where you were headed, so signing in drops you
back on the page you originally wanted.

### "Keep me signed in"

The checkbox controls two separate things:

**1. Where the session is stored**

| Checkbox | Session lives in | Survives closing the browser? |
| --- | --- | --- |
| On | `localStorage` | Yes |
| Off | `sessionStorage` | No — cleared with the tab |

Your email is also saved when the box is ticked, so it is pre-filled next time.
Signing out clears the session but keeps the remembered email; **Not you?** on
the login page clears that too.

**2. Whether your password is offered back to you**

Passwords are handed to the **browser's own credential store** via the
[Credential Management API](https://developer.mozilla.org/docs/Web/API/Credential_Management_API),
the same vault behind Chrome's "Save password?" prompt. On your next visit the
login page calls `navigator.credentials.get()` and, if you have a saved
credential for the site, fills in both fields and shows a small banner
confirming it came from your saved passwords.

The app itself never writes your password to `localStorage`, `sessionStorage`,
or any app-managed storage. That is deliberate: anything in those stores is
readable by any script on the page, so a single XSS bug would leak every saved
password in plaintext. The browser's store is encrypted at rest, synced across
your devices, and unreachable from page scripts — you get the same "I never
retype my password" result without the app becoming the weak link.

Credential Management is available in Chrome and Edge. In browsers without it
(Firefox, Safari) the email is still remembered and the session still persists;
the password is handled by that browser's own password manager through the
standard `autocomplete` attributes on the form.

Signing out calls `preventSilentAccess()` so the browser will not silently
re-fill straight after you deliberately signed out.

---

## Environment

Auth is optional. **With no configuration the app signs you in against a local
session stored in your browser**, so it works immediately after `npm install`.

To use real accounts, create a `.env` file:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The older `SUPA_BASE_PROJECT_URL` / `SUPA_BASE_API_KEY` names also work —
`vite.config.js` sets `envPrefix` so Vite exposes both. When these are present
the login page uses Supabase email/password auth, including sign-up. When they
are absent or the project is unreachable, you can still use **Continue on this
device only**.

`.env` is gitignored. Never commit real keys.

---

## Project structure

Note that source files sit at the repository root rather than in a `src/`
folder; `index.html` loads `/main.jsx` directly.

| Path | Purpose |
| --- | --- |
| `index.html` | Page shell, fonts, favicon, meta tags |
| `main.jsx` | Entry point — mounts `BrowserRouter` |
| `App.jsx` | Routes, auth gate, favourites/progress state, player host |
| `App.css` | The entire design system (tokens → components → responsive) |
| `vite.config.js` | Vite config, env prefixes, port handling |
| `Components/Login.jsx` | Login / sign-up page with remember-me |
| `Components/Navbar.jsx` | Sticky nav, active route state, mobile drawer |
| `Components/Home.jsx` | Hero, search/genre/sort toolbar, grid, pagination |
| `Components/Carousel.jsx` | Dependency-free scroll-snap rail of featured shows |
| `Components/Preview.jsx` | Show detail — season tabs and episode list |
| `Components/Favorite.jsx` | Saved episodes with search, sort and removal |
| `Components/History.jsx` | Listening history and "continue listening" |
| `Components/Player.jsx` | The single app-wide audio player |
| `Components/Footer.jsx` | Site footer |
| `Components/Icons.jsx` | Inline SVG icon set (no icon dependency) |
| `Components/lib.js` | Genre map, sorting, formatting, storage/session helpers |
| `Components/supabaseClient.js` | Supabase client, or `null` when unconfigured |

### Routes

| Route | Page |
| --- | --- |
| `/login` | Login / sign-up (redirects to the app if already signed in) |
| `/` | Discover — the catalogue |
| `/show/:showId` | Show detail with seasons and episodes |
| `/favorites` | Saved episodes |
| `/history` | Listening history |
| anything else | Redirects to `/` |

---

## Data

Shows come from the public `https://podcast-api.netlify.app` API:

- `GET /shows` — the full list. `genres` is an array of **numeric ids**, not
  names; the id → title map lives in `Components/lib.js` so the catalogue can be
  filtered without one request per genre.
- `GET /id/:id` — a single show with its seasons and episodes.

Episodes have no id of their own, so the app derives a stable key of
`showId::season::episodeTitle` (`episodeKey` in `lib.js`). Favourites and
progress are both stored against that key, which is what lets a favourited
episode and its resume position stay linked.

## What is stored in your browser

| Key | Storage | Contents |
| --- | --- | --- |
| `poa:user` | `localStorage` or `sessionStorage` | Current session `{ email, provider, remember }` |
| `poa:remembered-email` | `localStorage` | Email to pre-fill on the login page |
| `poa:favorites` | `localStorage` | Saved episodes, newest first |
| `poa:progress` | `localStorage` | Position/duration per episode — also backs the history page |
| `poa:volume` | `localStorage` | Player volume |

Passwords are **not** in this table by design — see
[How logging in works](#how-logging-in-works).

---

## Design

The interface uses a dark-first studio palette: violet `#9671FF` accent on
`#1D1D1D` / `#111` surfaces, one light `#F6F6F6` band, pill-shaped controls,
soft glows and rounded section transitions. Type is
[Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans) throughout.

Everything is driven by CSS custom properties at the top of `App.css`, so
retheming means editing the token block rather than hunting through rules.
The layout is responsive down to 375px, and honours
`prefers-reduced-motion`.

## Tech

React 18, Vite 5, React Router 6, Axios, Supabase JS (optional), PropTypes.
No UI framework and no icon library — the design system and icon set are local.
