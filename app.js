// ─── GrowthOS Entry Point ──────────────────────────────────────────────────
//
// Firebase config is injected into window.FIREBASE_CONFIG by build.js (Netlify)
// or entered at runtime via the setup screen (local / first run).

import { initAuth } from './auth.js';
import { state, set } from './state.js';
import { initRouter, register, navigate } from './router.js';
import { renderSetup, renderAuthScreen, setAuthListener } from './views/auth.js';
import { renderProjects } from './views/projects.js';
import { renderCanvas } from './views/canvas.js';

// ── Theme: apply before first paint ────────────────────────────────

document.documentElement.setAttribute('data-theme', state.theme);

// ── Bootstrap ───────────────────────────────────────────────────────

function boot() {
  if (window._needsSetup) {
    renderSetup();
    // Wire up: after setup connects Firebase, start auth listener
    setAuthListener(startAuthListener);
    return;
  }
  startAuthListener();
}

function startAuthListener() {
  initAuth({
    onSignedIn: () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/canvas/')) {
        const id = hash.replace('#/canvas/', '');
        navigate(`#/canvas/${id}`);
      } else {
        navigate('#/projects');
      }
    },
    onSignedOut: () => {
      navigate('#/');
    },
  });

  setupRoutes();
  initRouter();
}

function setupRoutes() {
  register('#/', () => {
    if (state.user) navigate('#/projects');
    else renderAuthScreen();
  });

  register('#/projects', () => {
    if (!state.user) { navigate('#/'); return; }
    renderProjects();
  });

  register('#/canvas/', hash => {
    if (!state.user) { navigate('#/'); return; }
    const id = hash.replace('#/canvas/', '');
    if (id) renderCanvas(id);
    else navigate('#/projects');
  });
}

// ── Start ───────────────────────────────────────────────────────────

boot();
