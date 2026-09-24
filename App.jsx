import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import Home from './Components/Home';
import Preview from './Components/Preview';
import Favorite from './Components/Favorite';
import History from './Components/History';
import Login from './Components/Login';
import Player from './Components/Player';
import supabase, { isSupabaseConfigured } from './Components/supabaseClient';
import {
  clearSession,
  readJSON,
  readSession,
  releaseCredentials,
  writeJSON,
  writeSession,
} from './Components/lib';

const KEY_FAVORITES = 'poa:favorites';
const KEY_PROGRESS = 'poa:progress';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Send a signed-out visitor to /login, carrying where they meant to go. */
function RedirectToLogin() {
  const location = useLocation();
  return (
    <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  );
}

/** Once signed in, /login bounces to wherever the visitor was headed. */
function RedirectFromLogin() {
  const location = useLocation();
  return <Navigate to={location.state?.from || '/'} replace />;
}

function App() {
  const [user, setUser] = useState(() => readSession());
  const [favorites, setFavorites] = useState(() => readJSON(KEY_FAVORITES, []));
  // Listening progress keyed by episode key. Doubles as the listening history,
  // so the two can never drift apart.
  const [progress, setProgress] = useState(() => readJSON(KEY_PROGRESS, {}));
  const [nowPlaying, setNowPlaying] = useState(null);

  /* ---------------------------------------------------------------- auth -- */

  // Adopt an existing Supabase session (and follow sign-in/out) when the
  // project is configured. Local demo sessions are untouched by this.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active || !data?.session?.user) return;
      // Supabase always persists to localStorage. If we have no session record
      // of our own, the user asked not to be remembered — honour that.
      if (!readSession()) {
        supabase.auth.signOut().catch(() => {});
        return;
      }
      setUser((prev) => ({
        ...prev,
        email: data.session.user.email,
        provider: 'supabase',
      }));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser((prev) => ({
          ...prev,
          email: session.user.email,
          provider: 'supabase',
        }));
      } else {
        setUser((prev) => (prev?.provider === 'supabase' ? null : prev));
      }
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    // Stop the browser silently re-filling straight after an explicit sign-out.
    await releaseCredentials();
    setUser(null);
    setNowPlaying(null);
  }, []);

  /* ------------------------------------------------------------ persist -- */

  useEffect(() => {
    if (user) writeSession(user);
    else clearSession();
  }, [user]);

  useEffect(() => {
    writeJSON(KEY_FAVORITES, favorites);
  }, [favorites]);

  useEffect(() => {
    writeJSON(KEY_PROGRESS, progress);
  }, [progress]);

  /* ---------------------------------------------------------- favorites -- */

  const favoriteKeys = useMemo(
    () => new Set(favorites.map((item) => item.key)),
    [favorites]
  );

  const toggleFavorite = useCallback((episode) => {
    setFavorites((prev) => {
      if (prev.some((item) => item.key === episode.key)) {
        return prev.filter((item) => item.key !== episode.key);
      }
      return [{ ...episode, addedAt: new Date().toISOString() }, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((key) => {
    setFavorites((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  /* ------------------------------------------------------------- player -- */

  const playEpisode = useCallback((episode) => {
    setNowPlaying(episode);
  }, []);

  const closePlayer = useCallback(() => setNowPlaying(null), []);

  // Called by the player on a throttled interval, on pause and on end.
  const recordProgress = useCallback((episode, position, duration, completed) => {
    if (!episode?.key) return;
    setProgress((prev) => ({
      ...prev,
      [episode.key]: {
        key: episode.key,
        showId: episode.showId,
        showTitle: episode.showTitle,
        showImage: episode.showImage,
        season: episode.season,
        seasonTitle: episode.seasonTitle,
        title: episode.title,
        file: episode.file,
        position: Math.floor(position) || 0,
        duration: Math.floor(duration) || prev[episode.key]?.duration || 0,
        completed: completed || prev[episode.key]?.completed || false,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const clearHistory = useCallback(() => setProgress({}), []);

  const removeHistoryItem = useCallback((key) => {
    setProgress((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  /* --------------------------------------------------------------- view -- */

  // Signed out: the login page owns every route, remembering where you were
  // headed so sign-in can return you there.
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onAuthenticated={setUser} />} />
        <Route path="*" element={<RedirectToLogin />} />
      </Routes>
    );
  }

  const shared = {
    favoriteKeys,
    toggleFavorite,
    playEpisode,
    nowPlayingKey: nowPlaying?.key ?? null,
    progress,
  };

  return (
    <div className={`app-shell${nowPlaying ? ' has-player' : ''}`}>
      <ScrollToTop />
      <Navbar
        user={user}
        favoriteCount={favorites.length}
        onSignOut={handleSignOut}
      />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<RedirectFromLogin />} />
          <Route path="/" element={<Home {...shared} />} />
          <Route path="/show/:showId" element={<Preview {...shared} />} />
          <Route
            path="/favorites"
            element={
              <Favorite
                favorites={favorites}
                onRemove={removeFavorite}
                onClearAll={clearFavorites}
                playEpisode={playEpisode}
                nowPlayingKey={nowPlaying?.key ?? null}
              />
            }
          />
          <Route
            path="/history"
            element={
              <History
                progress={progress}
                onReset={clearHistory}
                onRemove={removeHistoryItem}
                playEpisode={playEpisode}
                nowPlayingKey={nowPlaying?.key ?? null}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      {nowPlaying && (
        <Player
          episode={nowPlaying}
          resumeAt={progress[nowPlaying.key]?.position ?? 0}
          isFavorite={favoriteKeys.has(nowPlaying.key)}
          onToggleFavorite={() => toggleFavorite(nowPlaying)}
          onProgress={recordProgress}
          onClose={closePlayer}
        />
      )}
    </div>
  );
}

export default App;
