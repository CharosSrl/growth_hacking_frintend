// ─── API Client ────────────────────────────────────────────────────────────

import { state, set } from './state.js';
import { toast } from './components/toast.js';

const BASE = window.API_BASE || '/api';

async function getToken(forceRefresh = false) {
  const user = typeof firebase !== 'undefined' && firebase.auth().currentUser;
  if (user) {
    const token = await user.getIdToken(forceRefresh);
    set('token', token);
    return token;
  }
  return state.token;
}

function parseError(status, body) {
  if (body?.detail?.[0]?.msg) return body.detail[0].msg;
  if (body?.message) return body.message;
  const defaults = {
    400: 'Bad request.',
    401: 'Session expired — please sign in again.',
    403: 'Access denied.',
    404: 'Not found.',
    409: "You've reached the 10-project limit.",
    422: 'Validation error.',
  };
  return defaults[status] || `Unexpected error (${status}).`;
}

export async function api(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Token expired — refresh and retry once
  if (res.status === 401) {
    const newToken = await getToken(true);
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { ...headers, Authorization: `Bearer ${newToken}` },
    });
  }

  if (res.status === 204) return null;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = parseError(res.status, body);
    // 401 after refresh → force sign-out
    if (res.status === 401) {
      toast.error(msg);
      firebase.auth().signOut().catch(() => {});
    }
    throw Object.assign(new Error(msg), { status: res.status, body });
  }

  return body;
}

// Convenience wrappers
export const get    = (path)         => api(path);
export const post   = (path, data)   => api(path, { method: 'POST',   body: JSON.stringify(data) });
export const patch  = (path, data)   => api(path, { method: 'PATCH',  body: JSON.stringify(data) });
export const put    = (path, data)   => api(path, { method: 'PUT',    body: JSON.stringify(data) });
export const del    = (path)         => api(path, { method: 'DELETE' });
