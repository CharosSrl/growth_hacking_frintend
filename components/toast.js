// ─── Toast Notification System ─────────────────────────────────────────────

let container;
function getContainer() {
  if (!container) container = document.getElementById('toast-container');
  return container;
}

export function showToast(message, type = 'info', duration = 3500) {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  el.innerHTML = `
    <span class="toast__icon">${icon(type)}</span>
    <span class="toast__msg">${message}</span>
    <button class="toast__close" aria-label="Dismiss">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 1l12 12M13 1L1 13"/>
      </svg>
    </button>`;

  getContainer().appendChild(el);

  // Trigger animation
  requestAnimationFrame(() => el.classList.add('toast--visible'));

  const dismiss = () => {
    el.classList.remove('toast--visible');
    el.classList.add('toast--hiding');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  };

  el.querySelector('.toast__close').addEventListener('click', dismiss);
  const timer = setTimeout(dismiss, duration);
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => setTimeout(dismiss, 800));
}

export const toast = {
  success: (msg, d) => showToast(msg, 'success', d),
  error:   (msg, d) => showToast(msg, 'error', d),
  info:    (msg, d) => showToast(msg, 'info', d),
};

function icon(type) {
  if (type === 'success') return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 7l3.5 3.5L12 3"/></svg>`;
  if (type === 'error')   return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 2v5M7 10v1.5"/></svg>`;
  return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="7" cy="7" r="5.5"/><path d="M7 6.5v4M7 4.5v.5"/></svg>`;
}
