// ─── Hash Router ───────────────────────────────────────────────────────────

const routes = new Map();
let cleanup = null;

export function register(pattern, handler) {
  routes.set(pattern, handler);
}

export function navigate(hash) {
  window.location.hash = hash;
}

export function currentParams() {
  const hash = window.location.hash || '#/';
  const parts = hash.replace('#/', '').split('/');
  return parts;
}

function dispatch() {
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;

  const hash = window.location.hash || '#/';
  // Match longest prefix first
  let matched = null, matchedKey = '';
  for (const [key] of routes) {
    if (hash.startsWith(key) && key.length >= matchedKey.length) {
      matched = routes.get(key);
      matchedKey = key;
    }
  }
  if (matched) cleanup = matched(hash) || null;
}

export function initRouter() {
  window.addEventListener('hashchange', dispatch);
  dispatch();
}
