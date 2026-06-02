// ─── Modal Component ───────────────────────────────────────────────────────

let activeModal = null;

export function openModal({ title, body, confirmLabel = 'Confirm', onConfirm, danger = false }) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'modal-title');

  overlay.innerHTML = `
    <div class="modal" role="document">
      <div class="modal__header">
        <h2 class="modal__title" id="modal-title">${title}</h2>
        <button class="modal__close icon-btn" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 1l14 14M15 1L1 15"/>
          </svg>
        </button>
      </div>
      <div class="modal__body">${body}</div>
      <div class="modal__footer">
        <button class="btn btn--secondary modal__cancel">Cancel</button>
        <button class="btn ${danger ? 'btn--danger' : 'btn--primary'} modal__confirm">${confirmLabel}</button>
      </div>
    </div>`;

  document.getElementById('modal-container').appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));

  const close = () => closeModal();
  overlay.querySelector('.modal__close').addEventListener('click', close);
  overlay.querySelector('.modal__cancel').addEventListener('click', close);
  overlay.querySelector('.modal__confirm').addEventListener('click', () => {
    onConfirm(overlay);
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  // Focus trap
  const focusable = overlay.querySelectorAll('button, input, textarea, [tabindex]');
  const first = focusable[0], last = focusable[focusable.length - 1];
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  });

  setTimeout(() => (overlay.querySelector('input') || overlay.querySelector('.modal__confirm'))?.focus(), 50);
  activeModal = overlay;
  return overlay;
}

export function closeModal() {
  if (!activeModal) return;
  activeModal.classList.remove('modal-overlay--visible');
  activeModal.addEventListener('transitionend', () => activeModal?.remove(), { once: true });
  activeModal = null;
}
