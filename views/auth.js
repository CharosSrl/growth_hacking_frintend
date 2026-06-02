// ─── Auth View ────────────────────────────────────────────────────────────

import { signInWithGoogle } from '../auth.js';
import { toast } from '../components/toast.js';
import { navigate } from '../router.js';

// ── Setup Screen (when Firebase config is missing) ──────────────────────

export function renderSetup() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-screen">
      <div class="auth-bg"></div>
      <div class="auth-card auth-card--wide">
        <div class="auth-card__icon auth-card__icon--warning">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M10 2L18.5 17H1.5L10 2z"/><path d="M10 9v3M10 14.5v.5"/>
          </svg>
        </div>
        <h1 class="auth-card__title">Connect Firebase</h1>
        <p class="auth-card__sub">Paste your <code>firebaseConfig</code> from the Firebase Console to get started.<br>This is stored locally in your browser.</p>
        <ol class="setup-steps">
          <li>Firebase Console → your project → <strong>Project settings</strong></li>
          <li>Scroll to <strong>Your apps</strong> → select or create a Web app</li>
          <li>Copy the <code>firebaseConfig</code> object and paste below</li>
        </ol>
        <textarea id="setup-input" class="setup-textarea" spellcheck="false"
          placeholder='const firebaseConfig = {\n  apiKey: "AIza...",\n  authDomain: "...",\n  ...\n};'></textarea>
        <div id="setup-preview" class="setup-preview"></div>
        <p id="setup-error" class="setup-error" aria-live="polite"></p>
        <button id="setup-connect" class="btn btn--primary btn--full" disabled>Connect Firebase</button>
      </div>
    </div>`;

  const textarea = app.querySelector('#setup-input');
  const preview  = app.querySelector('#setup-preview');
  const errorEl  = app.querySelector('#setup-error');
  const connectBtn = app.querySelector('#setup-connect');

  let parsed = null;

  textarea.addEventListener('input', () => {
    errorEl.textContent = '';
    parsed = parseConfig(textarea.value.trim());
    if (parsed) {
      connectBtn.disabled = false;
      preview.innerHTML = ['projectId', 'authDomain', 'appId']
        .filter(k => parsed[k])
        .map(k => `<span class="setup-chip"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1.5 5l2.5 2.5L8.5 2"/></svg>${k}</span>`)
        .join('');
    } else {
      connectBtn.disabled = true;
      preview.innerHTML = '';
      if (textarea.value.trim()) errorEl.textContent = 'Could not parse config — paste the full firebaseConfig object.';
    }
  });

  connectBtn.addEventListener('click', async () => {
    if (!parsed) return;
    connectBtn.disabled = true;
    connectBtn.textContent = 'Connecting…';
    try {
      if (!firebase.apps.length) firebase.initializeApp(parsed);
      firebase.auth();
      localStorage.setItem('growthos_config', JSON.stringify(parsed));
      window._needsSetup = false;
      toast.success('Firebase connected!');
      renderAuthScreen();
      initAuthListener();
    } catch (e) {
      errorEl.textContent = 'Initialization failed: ' + (e.message || 'unknown error');
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect Firebase';
    }
  });
}

function parseConfig(text) {
  try {
    const c = JSON.parse(text);
    if (c?.apiKey && !c.apiKey.startsWith('YOUR_')) return c;
  } catch {}
  const keys = ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId','measurementId'];
  const out = {};
  for (const k of keys) {
    const m = text.match(new RegExp(k + '\\s*:\\s*["\`\']((?:[^"\`\'\\\\]|\\\\.)*)'));
    if (m) out[k] = m[1];
  }
  return (out.apiKey && !out.apiKey.startsWith('YOUR_')) ? out : null;
}

// ── Auth Screen ─────────────────────────────────────────────────────────

let _authListener = null;
export function setAuthListener(fn) { _authListener = fn; }
function initAuthListener() { _authListener?.(); }

export function renderAuthScreen() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-screen">
      <div class="auth-bg"></div>
      <div class="auth-card">
        <div class="auth-logo">
          <div class="auth-logo__mark">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 18L11 4l7 14" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
              <path d="M7 13h8" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="auth-logo__text">GrowthOS</span>
        </div>
        <p class="auth-card__sub">B2B Growth Strategy Canvas</p>
        <button id="btn-google-signin" class="btn btn--google">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <p class="auth-card__note">By signing in you agree to our terms of service.</p>
      </div>
    </div>`;

  const btn = app.querySelector('#btn-google-signin');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Signing in…`;
    try {
      await signInWithGoogle();
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        toast.error('Sign in failed. Please try again.');
      }
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg> Continue with Google`;
    }
  });
}
