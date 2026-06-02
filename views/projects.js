// ─── Projects View ─────────────────────────────────────────────────────────

import { get, post, patch, del } from '../api.js';
import { state, set } from '../state.js';
import { toast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { skeletonProjectGrid } from '../components/skeleton.js';
import { navigate } from '../router.js';

const ACCENT_COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

function projectColor(i) { return ACCENT_COLORS[i % ACCENT_COLORS.length]; }

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function countNotes(canvas) {
  if (!canvas) return 0;
  return Object.values(canvas).reduce((sum, fields) =>
    sum + Object.values(fields).reduce((s, notes) => s + (notes?.length ?? 0), 0), 0);
}

// ── Render ──────────────────────────────────────────────────────────────

export async function renderProjects() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page projects-page">
      ${renderHeader()}
      <main class="page__main" id="projects-main">
        <div class="projects-toolbar">
          <div>
            <h1 class="page-title">Projects</h1>
            <p class="page-sub">Your growth strategy canvases</p>
          </div>
          <div class="projects-toolbar__right">
            <div class="project-limit" id="project-limit"></div>
            <button class="btn btn--primary" id="btn-new-project">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 1v12M1 7h12"/></svg>
              New project
            </button>
          </div>
        </div>
        <div class="projects-grid" id="projects-grid">
          ${skeletonProjectGrid(6)}
        </div>
      </main>
    </div>`;

  bindHeader();
  document.getElementById('btn-new-project').addEventListener('click', openCreateModal);

  await loadProjects();
}

async function loadProjects() {
  try {
    const projects = await get('/projects');
    set('projects', projects);
    renderGrid(projects);
  } catch (e) {
    toast.error(e.message);
    document.getElementById('projects-grid').innerHTML = `<p class="error-state">Failed to load projects.</p>`;
  }
}

function renderGrid(projects) {
  const grid   = document.getElementById('projects-grid');
  const limit  = document.getElementById('project-limit');
  if (!grid) return;

  const pct = projects.length / 10;
  limit.innerHTML = `
    <div class="limit-track" title="${projects.length}/10 projects">
      <div class="limit-fill ${pct >= 0.8 ? 'limit-fill--warn' : ''} ${pct >= 1 ? 'limit-fill--full' : ''}"
           style="width:${pct * 100}%"></div>
    </div>
    <span class="limit-label">${projects.length}/10</span>`;

  if (projects.length === 0) {
    grid.innerHTML = renderEmptyState();
    grid.querySelector('#btn-empty-create')?.addEventListener('click', openCreateModal);
    return;
  }

  grid.innerHTML = projects.map((p, i) => renderProjectCard(p, i)).join('');

  // Staggered entrance animation
  grid.querySelectorAll('.project-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 40}ms`;
    card.classList.add('project-card--entering');
  });

  bindProjectCards(projects);
}

function renderProjectCard(p, i) {
  const color = projectColor(i);
  const initials = (p.name || '?').slice(0, 2).toUpperCase();
  return `
    <article class="project-card" data-id="${p.id}" data-index="${i}" tabindex="0"
             role="button" aria-label="Open project ${p.name}" style="--card-accent:${color}">
      <div class="project-card__accent"></div>
      <div class="project-card__body">
        <div class="project-card__icon" style="background:${color}20;color:${color}">${initials}</div>
        <div class="project-card__name">${escHtml(p.name)}</div>
        <div class="project-card__meta">Created ${formatDate(p.created_at)}</div>
      </div>
      <div class="project-card__footer">
        <div class="project-card__actions" role="group" aria-label="Project actions">
          <button class="icon-btn btn-rename" data-id="${p.id}" data-name="${escAttr(p.name)}" title="Rename" aria-label="Rename project">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8z"/></svg>
          </button>
          <button class="icon-btn btn-delete" data-id="${p.id}" data-name="${escAttr(p.name)}" title="Delete" aria-label="Delete project">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1.5 3.5h11M4.5 3.5V2h5v1.5M5 6v5M9 6v5M2.5 3.5l1 9h7l1-9"/></svg>
          </button>
        </div>
      </div>
    </article>`;
}

function renderEmptyState() {
  return `
    <div class="empty-state">
      <div class="empty-state__illustration">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="10" y="16" width="60" height="48" rx="6" fill="var(--bg-overlay)" stroke="var(--border-default)" stroke-width="1.5"/>
          <rect x="20" y="28" width="24" height="4" rx="2" fill="var(--border-strong)"/>
          <rect x="20" y="36" width="40" height="3" rx="1.5" fill="var(--border-default)"/>
          <rect x="20" y="42" width="32" height="3" rx="1.5" fill="var(--border-default)"/>
          <circle cx="58" cy="54" r="10" fill="var(--accent)"/>
          <path d="M54 54h8M58 50v8" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <h3 class="empty-state__title">No projects yet</h3>
      <p class="empty-state__desc">Create your first growth strategy canvas to get started.</p>
      <button class="btn btn--primary" id="btn-empty-create">Create project</button>
    </div>`;
}

// ── Modals / Inline Confirm ───────────────────────────────────────────

function openCreateModal() {
  openModal({
    title: 'New project',
    body: `<input class="input" id="new-project-name" type="text" placeholder="e.g. My SaaS Growth Plan" maxlength="100" autocomplete="off">`,
    confirmLabel: 'Create',
    onConfirm: async () => {
      const name = document.getElementById('new-project-name')?.value.trim();
      if (!name) return;
      closeModal();
      try {
        if (state.projects.length >= 10) {
          toast.info("You've reached the 10-project limit. Delete one to create a new project.");
          return;
        }
        const project = await post('/projects', { name });
        set('projects', [project, ...state.projects]);
        renderGrid(state.projects);
        toast.success(`"${project.name}" created`);
      } catch (e) {
        if (e.status !== 409) toast.error(e.message);
        else toast.info("You've reached the 10-project limit.");
      }
    },
  });
  setTimeout(() => document.getElementById('new-project-name')?.focus(), 60);
}

function startInlineRename(card, id, currentName) {
  const nameEl = card.querySelector('.project-card__name');
  const original = nameEl.innerHTML;
  nameEl.innerHTML = `<input class="card-inline-input" value="${escAttr(currentName)}" maxlength="100" aria-label="Rename project">`;
  const input = nameEl.querySelector('input');
  input.focus(); input.select();

  const confirm = async () => {
    const newName = input.value.trim();
    if (!newName || newName === currentName) { nameEl.innerHTML = original; return; }
    nameEl.innerHTML = escHtml(newName);
    try {
      const updated = await patch(`/projects/${id}`, { name: newName });
      const idx = state.projects.findIndex(p => p.id === id);
      if (idx !== -1) state.projects[idx] = updated;
      toast.success('Renamed');
    } catch (e) {
      nameEl.innerHTML = original;
      toast.error(e.message);
    }
  };

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') confirm();
    if (e.key === 'Escape') { nameEl.innerHTML = original; }
  });
  input.addEventListener('blur', confirm);
}

function startInlineDelete(btn, id, name) {
  const original = btn.innerHTML;
  const actionsEl = btn.closest('.project-card__actions');
  actionsEl.innerHTML = `
    <span class="inline-confirm">
      Delete?
      <button class="btn btn--danger btn--xs confirm-yes" data-id="${id}">Yes</button>
      <button class="btn btn--secondary btn--xs confirm-no">No</button>
    </span>`;

  actionsEl.querySelector('.confirm-yes').addEventListener('click', async () => {
    const card = actionsEl.closest('.project-card');
    card.classList.add('project-card--removing');
    try {
      await del(`/projects/${id}`);
      set('projects', state.projects.filter(p => p.id !== id));
      card.addEventListener('transitionend', () => { renderGrid(state.projects); }, { once: true });
      toast.success(`"${name}" deleted`);
    } catch (e) {
      card.classList.remove('project-card--removing');
      toast.error(e.message);
      renderGrid(state.projects);
    }
  });
  actionsEl.querySelector('.confirm-no').addEventListener('click', () => {
    renderGrid(state.projects);
  });
}

// ── Event Binding ───────────────────────────────────────────────────

function bindProjectCards(projects) {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  grid.querySelectorAll('.project-card').forEach(card => {
    const id = card.dataset.id;
    const proj = projects.find(p => p.id === id);
    if (!proj) return;

    // Open canvas on click (not on action buttons)
    card.addEventListener('click', e => {
      if (e.target.closest('.project-card__actions')) return;
      set('currentProject', proj);
      navigate(`#/canvas/${id}`);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.target.closest('.project-card__actions')) {
        set('currentProject', proj);
        navigate(`#/canvas/${id}`);
      }
    });
  });

  grid.querySelectorAll('.btn-rename').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.project-card');
      startInlineRename(card, btn.dataset.id, btn.dataset.name);
    });
  });

  grid.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      startInlineDelete(btn, btn.dataset.id, btn.dataset.name);
    });
  });
}

// ── Header ────────────────────────────────────────────────────────────

function renderHeader() {
  const user = state.user;
  const theme = state.theme;
  return `
    <header class="app-header">
      <div class="app-header__left">
        <a href="#/projects" class="app-logo" aria-label="GrowthOS home">
          <div class="app-logo__mark">
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <path d="M4 18L11 4l7 14" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
              <path d="M7 13h8" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="app-logo__text">GrowthOS</span>
        </a>
      </div>
      <div class="app-header__right">
        <button class="icon-btn theme-toggle" id="theme-toggle" title="Toggle theme" aria-label="Toggle theme">
          ${theme === 'dark' ? sunIcon() : moonIcon()}
        </button>
        ${user ? `
          <div class="user-menu">
            ${user.photoURL
              ? `<img src="${user.photoURL}" class="user-avatar" alt="${escAttr(user.displayName || 'User')}" referrerpolicy="no-referrer">`
              : `<div class="user-avatar user-avatar--initials">${(user.displayName || user.email || 'U')[0].toUpperCase()}</div>`}
            <button class="btn btn--ghost btn--sm" id="btn-signout">Sign out</button>
          </div>` : ''}
        <button class="icon-btn" id="btn-reconfig" title="Reconfigure Firebase" aria-label="Reconfigure Firebase">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="8" cy="8" r="2.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M11.89 4.11l1.06-1.06M3.05 12.95l1.06-1.06"/>
          </svg>
        </button>
      </div>
    </header>`;
}

function bindHeader() {
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('btn-signout')?.addEventListener('click', async () => {
    const { signOut } = await import('../auth.js');
    await signOut();
  });
  document.getElementById('btn-reconfig')?.addEventListener('click', () => {
    localStorage.removeItem('growthos_config');
    toast.info('Config cleared — reloading…');
    setTimeout(() => location.reload(), 900);
  });
}

function toggleTheme() {
  const next = state.theme === 'dark' ? 'light' : 'dark';
  set('theme', next);
  localStorage.setItem('growthos_theme', next);
  document.documentElement.setAttribute('data-theme', next);
  document.getElementById('theme-toggle').innerHTML = next === 'dark' ? sunIcon() : moonIcon();
}

function sunIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="8" r="3"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M11.89 4.11l1.06-1.06M3.05 12.95l1.06-1.06"/></svg>`;
}
function moonIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13.5 10.5A6 6 0 015.5 2.5a6 6 0 108 8z"/></svg>`;
}

// ── Utils ─────────────────────────────────────────────────────────────

function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }

export { renderHeader, bindHeader, toggleTheme, sunIcon, moonIcon, escHtml, escAttr };
