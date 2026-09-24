import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import supabase, { isSupabaseConfigured } from './supabaseClient';
import { IconAlert, IconCheck, IconEye, IconEyeOff, IconMic } from './Icons';
import {
  forgetRememberedEmail,
  hasCredentialManager,
  readRememberedEmail,
  requestCredential,
  saveRememberedEmail,
  storeCredential,
} from './lib';

const POINTS = [
  'Thousands of series, searchable in one field',
  'Preview any season before you commit',
  'Your place in every episode, remembered',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login({ onAuthenticated }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState(() => readRememberedEmail());
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => Boolean(readRememberedEmail()));
  const [revealed, setRevealed] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [autofilled, setAutofilled] = useState(false);

  const passwordRef = useRef(null);

  /* Offer a saved browser credential (Chrome/Edge). No prompt if none exists. */
  useEffect(() => {
    let active = true;
    requestCredential().then((credential) => {
      if (!active || !credential) return;
      setEmail(credential.id);
      setPassword(credential.password);
      setRemember(true);
      setAutofilled(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!EMAIL_RE.test(email.trim()))
      next.email = 'That does not look like an email address.';
    if (!password) next.password = 'Enter a password.';
    else if (password.length < 6) next.password = 'Use at least 6 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /** Persist the choice, hand the pair to the password manager, then sign in. */
  const finish = async (session) => {
    if (remember) {
      saveRememberedEmail(session.email);
      await storeCredential(session.email, password);
    } else {
      forgetRememberedEmail();
    }
    onAuthenticated({ ...session, remember });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setNotice('');
    if (!validate()) return;

    const address = email.trim();

    // Without Supabase credentials the app runs on a local session so it stays
    // usable out of the box.
    if (!isSupabaseConfigured || !supabase) {
      await finish({ email: address, provider: 'local' });
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: address,
          password,
        });
        if (error) throw error;
        if (data.session) {
          await finish({ email: data.user.email, provider: 'supabase' });
        } else {
          setNotice('Check your inbox to confirm the address, then sign in.');
          setMode('signin');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: address,
          password,
        });
        if (error) throw error;
        await finish({ email: data.user.email, provider: 'supabase' });
      }
    } catch (err) {
      setFormError(err?.message || 'Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const continueLocally = async () => {
    const address = email.trim();
    if (!address || !EMAIL_RE.test(address)) {
      setErrors({ email: 'Enter an email address to continue.' });
      return;
    }
    await finish({ email: address, provider: 'local' });
  };

  const switchMode = () => {
    setMode(mode === 'signup' ? 'signin' : 'signup');
    setErrors({});
    setFormError('');
    setNotice('');
  };

  const useDifferentAccount = () => {
    forgetRememberedEmail();
    setEmail('');
    setPassword('');
    setAutofilled(false);
    setRemember(false);
  };

  return (
    <div className="auth">
      <aside className="auth__aside">
        <span className="hero__glow hero__glow--a" aria-hidden="true" />
        <span className="hero__glow hero__glow--b" aria-hidden="true" />

        <span className="brand">
          <span className="brand__mark" aria-hidden="true">
            <IconMic size={18} />
          </span>
          <span className="brand__name">
            Alexandria<em>.fm</em>
          </span>
        </span>

        <div>
          <p className="auth__quote">
            The whole library, and only the shows you keep.
          </p>
          <div className="auth__points">
            {POINTS.map((point) => (
              <div className="auth__point" key={point}>
                <span className="auth__tick" aria-hidden="true">
                  <IconCheck size={13} />
                </span>
                {point}
              </div>
            ))}
          </div>
        </div>

        <p className="stat__label">Built with React, Vite and the podcast-api.</p>
      </aside>

      <main className="auth__main">
        <div className="auth__card">
          <h1 className="auth__title">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="auth__sub">
            {mode === 'signup'
              ? 'Set up an account to keep favourites and progress in sync.'
              : 'Sign in to pick up exactly where you left off.'}
          </p>

          {autofilled && (
            <div className="auth__recall">
              <span className="nav__avatar" aria-hidden="true">
                {email[0]}
              </span>
              <div className="auth__recall-body">
                <strong>{email}</strong>
                <span>Filled in from your saved passwords</span>
              </div>
              <button type="button" className="linkish" onClick={useDifferentAccount}>
                Not you?
              </button>
            </div>
          )}

          {formError && (
            <div className="alert" style={{ marginBottom: 20 }}>
              <IconAlert size={20} />
              <div>
                <div className="alert__title">
                  {mode === 'signup'
                    ? 'Could not create account'
                    : 'Could not sign in'}
                </div>
                <p>{formError}</p>
              </div>
            </div>
          )}

          {notice && (
            <div className="auth__note" style={{ marginTop: 0, marginBottom: 20 }}>
              {notice}
            </div>
          )}

          <form
            className="auth__form"
            onSubmit={handleSubmit}
            method="post"
            action="#"
            noValidate
          >
            <div className="field">
              <label className="field__label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="username"
                type="email"
                autoComplete="username"
                className={`input${errors.email ? ' input--error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <span className="field__error" id="email-error">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">
                Password
              </label>
              <div className="field__wrap">
                <input
                  id="password"
                  name="password"
                  ref={passwordRef}
                  type={revealed ? 'text' : 'password'}
                  autoComplete={
                    mode === 'signup' ? 'new-password' : 'current-password'
                  }
                  className={`input input--with-affix${
                    errors.password ? ' input--error' : ''
                  }`}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="field__affix"
                  onClick={() => setRevealed((value) => !value)}
                  aria-label={revealed ? 'Hide password' : 'Show password'}
                  aria-pressed={revealed}
                >
                  {revealed ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="field__error" id="password-error">
                  {errors.password}
                </span>
              )}
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span className="checkbox__box" aria-hidden="true">
                <IconCheck size={12} />
              </span>
              <span>
                Keep me signed in
                <span className="checkbox__hint">
                  {hasCredentialManager()
                    ? 'Stays signed in on this device and offers to save your password.'
                    : 'Stays signed in on this device.'}
                </span>
              </span>
            </label>

            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={busy}
            >
              {busy && <span className="spinner" aria-hidden="true" />}
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="auth__foot">
            {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
            <button type="button" onClick={switchMode}>
              {mode === 'signup' ? 'Sign in instead' : 'Create an account'}
            </button>
          </p>

          {isSupabaseConfigured ? (
            <div className="auth__note">
              Accounts are handled by Supabase. Prefer not to sign up?{' '}
              <button type="button" className="linkish" onClick={continueLocally}>
                Continue on this device only
              </button>
              .
            </div>
          ) : (
            <div className="auth__note">
              Supabase is not configured, so this session is stored in your
              browser. Add <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code> to enable
              real accounts.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

Login.propTypes = {
  onAuthenticated: PropTypes.func.isRequired,
};
