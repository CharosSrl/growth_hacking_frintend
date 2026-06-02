// ─── Reactive State Store ──────────────────────────────────────────────────
// Simple pub/sub. Modules import { state, set, on } to read/write/subscribe.

export const state = {
  user: null,
  token: null,
  projects: [],
  currentProject: null,
  canvas: null,
  theme: localStorage.getItem('growthos_theme') || 'dark',
};

const _listeners = new Map();

export function set(key, value) {
  state[key] = value;
  _listeners.get(key)?.forEach(fn => fn(value));
}

export function on(key, fn) {
  if (!_listeners.has(key)) _listeners.set(key, new Set());
  _listeners.get(key).add(fn);
  return () => _listeners.get(key).delete(fn);
}
