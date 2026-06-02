// ─── Canvas View ───────────────────────────────────────────────────────────

import { get, post, patch, del } from '../api.js';
import { state, set } from '../state.js';
import { toast } from '../components/toast.js';
import { navigate } from '../router.js';
import { renderHeader, bindHeader, escHtml, escAttr } from './projects.js';

// ── Canvas Schema ────────────────────────────────────────────────────

export const CANVAS_SCHEMA = [
  { key: 'project_overview', label: 'Project Overview', color: '#6366f1',
    fields: ['unique_value_proposition','secret_sauce','core_value','target_customers','why'] },
  { key: 'metrics', label: 'Metrics', color: '#06b6d4',
    fields: ['formula','north_star_metric'] },
  { key: 'retention', label: 'Retention', color: '#10b981',
    fields: ['short_term','medium_term','long_term'] },
  { key: 'acquisition', label: 'Acquisition', color: '#f59e0b',
    fields: ['language_market_fit','channel_product_fit'] },
  { key: 'toolbox', label: 'Toolbox', color: '#ef4444',
    fields: ['data_mining','social_tracking','ads_tracking','surveys','other'] },
  { key: 'high_tempo_testing', label: 'High-Tempo Testing', color: '#8b5cf6',
    fields: ['framework','frequency'] },
  { key: 'customer_loops', label: 'Customer Loops', color: '#ec4899',
    fields: ['payload','conversion_rate','frequency'] },
];

function toTitle(key) {
  return key.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// ── Render ──────────────────────────────────────────────────────────

export async function renderCanvas(projectId) {
  const app = document.getElementById('app');

  // Resolve project
  let project = state.currentProject;
  if (!project || project.id !== projectId) {
    try { project = await get(`/projects/${projectId}`); set('currentProject', project); }
    catch (e) { toast.error('Project not found.'); navigate('#/projects'); return; }
  }

  app.innerHTML = `
    <div class="page canvas-page">
      ${renderCanvasHeader(project)}
      <main class="page__main" id="canvas-main">
        <div class="canvas-grid" id="canvas-grid">
          ${renderSkeletonCanvas()}
        </div>
      </main>
    </div>`;

  bindCanvasHeader(project);

  try {
    const canvas = await get(`/projects/${projectId}/canvas`);
    set('canvas', canvas);
    renderSections(canvas, projectId);
  } catch (e) {
    toast.error(e.message);
  }
}

function renderSkeletonCanvas() {
  return CANVAS_SCHEMA.map(() => `
    <div class="section-card section-card--skeleton">
      <div class="skeleton skeleton--label" style="width:120px;margin-bottom:16px"></div>
      ${[1,2].map(() => `<div class="skeleton skeleton--note" style="margin-bottom:8px"></div>`).join('')}
    </div>`).join('');
}

function renderSections(canvas, projectId) {
  const grid = document.getElementById('canvas-grid');
  if (!grid) return;

  grid.innerHTML = CANVAS_SCHEMA.map((sec, i) => `
    <section class="section-card" data-section="${sec.key}"
             style="--sec-color:${sec.color};animation-delay:${i * 50}ms"
             aria-labelledby="sec-title-${sec.key}">
      <div class="section-card__head">
        <span class="section-dot" aria-hidden="true"></span>
        <h2 class="section-title" id="sec-title-${sec.key}">${sec.label}</h2>
        <span class="section-count">${countSectionNotes(canvas, sec.key)}</span>
      </div>
      <div class="section-card__body">
        ${sec.fields.map(field => renderField(canvas, sec, field, projectId)).join('')}
      </div>
    </section>`).join('');

  grid.querySelectorAll('.section-card').forEach(el => {
    el.classList.add('section-card--entering');
  });

  bindCanvas(projectId);
}

function renderField(canvas, sec, fieldKey, projectId) {
  const notes = (canvas[sec.key]?.[fieldKey] ?? []).slice().sort((a, b) => a.order - b.order);
  return `
    <div class="field-group" data-section="${sec.key}" data-field="${fieldKey}">
      <div class="field-label">${toTitle(fieldKey)}</div>
      <div class="notes-list" id="notes-${sec.key}-${fieldKey}"
           role="list" aria-label="${toTitle(fieldKey)} notes"
           data-section="${sec.key}" data-field="${fieldKey}">
        ${notes.map(n => renderNote(n, sec.color)).join('')}
      </div>
      <div class="add-note-area" id="add-area-${sec.key}-${fieldKey}">
        <button class="btn-add-note" data-section="${sec.key}" data-field="${fieldKey}"
                aria-label="Add note to ${toTitle(fieldKey)}">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 1v10M1 6h10"/></svg>
          Add note
        </button>
      </div>
    </div>`;
}

function renderNote(note, color) {
  return `
    <div class="note-chip" id="note-${note.id}" data-id="${note.id}"
         role="listitem" draggable="true" tabindex="0"
         aria-label="${escAttr(note.content)}">
      <span class="note-chip__drag" aria-hidden="true">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
          <circle cx="3" cy="3" r="1.2" fill="currentColor"/><circle cx="7" cy="3" r="1.2" fill="currentColor"/>
          <circle cx="3" cy="7" r="1.2" fill="currentColor"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/>
          <circle cx="3" cy="11" r="1.2" fill="currentColor"/><circle cx="7" cy="11" r="1.2" fill="currentColor"/>
        </svg>
      </span>
      <span class="note-chip__text">${escHtml(note.content)}</span>
      <div class="note-chip__actions">
        <button class="note-action-btn btn-note-edit" data-id="${note.id}" aria-label="Edit note" title="Edit">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 1.5l2.5 2.5-7 7H1v-2.5l7-7z"/></svg>
        </button>
        <button class="note-action-btn btn-note-delete" data-id="${note.id}" aria-label="Delete note" title="Delete">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 3h10M3.5 3V2h5v1M2 3l1 8h6l1-8"/></svg>
        </button>
      </div>
    </div>`;
}

function renderAddForm(section, field, color) {
  return `
    <div class="add-note-form" id="form-${section}-${field}">
      <textarea class="note-textarea" rows="2"
        placeholder="Add a note…" aria-label="New note content"
        id="ta-${section}-${field}"></textarea>
      <div class="add-note-form__actions">
        <button class="btn btn--secondary btn--sm btn-cancel-add" data-section="${section}" data-field="${field}">Cancel</button>
        <button class="btn btn--primary btn--sm btn-submit-add" data-section="${section}" data-field="${field}">Add</button>
      </div>
    </div>`;
}

function renderEditForm(noteId, currentContent) {
  return `
    <div class="edit-note-form" id="edit-form-${noteId}">
      <textarea class="note-textarea" rows="2" aria-label="Edit note"
        id="ta-edit-${noteId}">${escHtml(currentContent)}</textarea>
      <div class="add-note-form__actions">
        <button class="btn btn--secondary btn--sm btn-cancel-edit" data-id="${noteId}">Cancel</button>
        <button class="btn btn--primary btn--sm btn-submit-edit" data-id="${noteId}">Save</button>
      </div>
    </div>`;
}

// ── Event Binding ────────────────────────────────────────────────────

function bindCanvas(projectId) {
  const grid = document.getElementById('canvas-grid');
  if (!grid) return;

  // Add note buttons
  grid.querySelectorAll('.btn-add-note').forEach(btn => {
    btn.addEventListener('click', () => openAddForm(btn.dataset.section, btn.dataset.field, projectId));
  });

  // Edit / Delete (delegated)
  grid.addEventListener('click', e => {
    const editBtn = e.target.closest('.btn-note-edit');
    if (editBtn) { openEditForm(editBtn.dataset.id, projectId); return; }

    const delBtn = e.target.closest('.btn-note-delete');
    if (delBtn) { confirmDeleteNote(delBtn, projectId); return; }

    const submitAdd = e.target.closest('.btn-submit-add');
    if (submitAdd) { submitNote(submitAdd.dataset.section, submitAdd.dataset.field, projectId); return; }

    const cancelAdd = e.target.closest('.btn-cancel-add');
    if (cancelAdd) { closeAddForm(cancelAdd.dataset.section, cancelAdd.dataset.field); return; }

    const submitEdit = e.target.closest('.btn-submit-edit');
    if (submitEdit) { submitEdit_(submitEdit.dataset.id, projectId); return; }

    const cancelEdit = e.target.closest('.btn-cancel-edit');
    if (cancelEdit) { closeEditForm(cancelEdit.dataset.id, projectId); return; }
  });

  // Keyboard save shortcuts
  grid.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const ta = e.target.closest('textarea');
      if (!ta) return;
      e.preventDefault();
      const addBtn = ta.closest('.add-note-form')?.querySelector('.btn-submit-add');
      const editBtn = ta.closest('.edit-note-form')?.querySelector('.btn-submit-edit');
      addBtn?.click(); editBtn?.click();
    }
    if (e.key === 'Escape') {
      const ta = e.target.closest('textarea');
      if (!ta) return;
      const cancelAdd = ta.closest('.add-note-form')?.querySelector('.btn-cancel-add');
      const cancelEdit = ta.closest('.edit-note-form')?.querySelector('.btn-cancel-edit');
      cancelAdd?.click(); cancelEdit?.click();
    }
  });

  initDragDrop(projectId);
}

// ── Add Note ─────────────────────────────────────────────────────────

function openAddForm(section, field, projectId) {
  const area = document.getElementById(`add-area-${section}-${field}`);
  if (!area) return;
  const sec = CANVAS_SCHEMA.find(s => s.key === section);
  area.innerHTML = renderAddForm(section, field, sec?.color);
  const ta = document.getElementById(`ta-${section}-${field}`);
  ta?.focus();
}

function closeAddForm(section, field) {
  const area = document.getElementById(`add-area-${section}-${field}`);
  if (!area) return;
  area.innerHTML = `
    <button class="btn-add-note" data-section="${section}" data-field="${field}"
            aria-label="Add note to ${toTitle(field)}">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 1v10M1 6h10"/></svg>
      Add note
    </button>`;
  area.querySelector('.btn-add-note').addEventListener('click', () => openAddForm(section, field, null));
}

async function submitNote(section, field, projectId) {
  const ta = document.getElementById(`ta-${section}-${field}`);
  const content = ta?.value.trim();
  if (!content) return;

  const canvas = state.canvas;
  const existing = (canvas[section]?.[field] ?? []);
  const order = existing.length;

  // Optimistic
  const tempId = `_tmp_${Date.now()}`;
  const tempNote = { id: tempId, project_id: projectId, section, field, content, order, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  addNoteToState(section, field, tempNote);
  closeAddForm(section, field);
  appendNoteToDOM(section, field, tempNote);

  try {
    const real = await post(`/projects/${projectId}/notes`, { section, field, content, order });
    replaceNoteInState(section, field, tempId, real);
    const chip = document.getElementById(`note-${tempId}`);
    if (chip) chip.id = `note-${real.id}`, chip.dataset.id = real.id;
    chip?.querySelectorAll('[data-id]').forEach(el => el.dataset.id = real.id);
  } catch (e) {
    removeNoteFromState(section, field, tempId);
    document.getElementById(`note-${tempId}`)?.remove();
    toast.error(e.message);
  }
}

// ── Edit Note ─────────────────────────────────────────────────────────

function openEditForm(noteId, projectId) {
  const chip = document.getElementById(`note-${noteId}`);
  if (!chip) return;
  const current = chip.querySelector('.note-chip__text')?.textContent || '';
  const sec = getSectionForNote(noteId);
  chip.outerHTML; // read
  chip.insertAdjacentHTML('afterend', renderEditForm(noteId, current));
  chip.style.display = 'none';
  const ta = document.getElementById(`ta-edit-${noteId}`);
  ta?.focus(); ta?.select();
}

function closeEditForm(noteId, projectId) {
  const form = document.getElementById(`edit-form-${noteId}`);
  if (form) form.remove();
  const chip = document.getElementById(`note-${noteId}`);
  if (chip) chip.style.display = '';
}

async function submitEdit_(noteId, projectId) {
  const ta = document.getElementById(`ta-edit-${noteId}`);
  const content = ta?.value.trim();
  if (!content) return;

  const chip = document.getElementById(`note-${noteId}`);
  const textEl = chip?.querySelector('.note-chip__text');
  const originalContent = textEl?.textContent || '';

  if (textEl) textEl.textContent = content;
  closeEditForm(noteId, projectId);

  // Find section/field for rollback
  const { section, field } = findNotePosition(noteId);

  try {
    const updated = await patch(`/projects/${projectId}/notes/${noteId}`, { content });
    updateNoteInState(section, field, noteId, updated);
  } catch (e) {
    if (textEl) textEl.textContent = originalContent;
    toast.error(e.message);
  }
}

// ── Delete Note ───────────────────────────────────────────────────────

function confirmDeleteNote(btn, projectId) {
  const noteId = btn.dataset.id;
  const actionsEl = btn.closest('.note-chip__actions');
  const orig = actionsEl.innerHTML;

  actionsEl.innerHTML = `
    <span class="inline-confirm inline-confirm--note">
      <button class="btn btn--danger btn--xs confirm-yes" data-id="${noteId}">Delete</button>
      <button class="btn btn--secondary btn--xs confirm-no">No</button>
    </span>`;

  actionsEl.querySelector('.confirm-yes').addEventListener('click', () => deleteNote(noteId, projectId));
  actionsEl.querySelector('.confirm-no').addEventListener('click', () => { actionsEl.innerHTML = orig; bindChipActions(actionsEl.closest('.note-chip'), projectId); });
}

async function deleteNote(noteId, projectId) {
  const chip = document.getElementById(`note-${noteId}`);
  const { section, field } = findNotePosition(noteId);
  const savedNote = getNoteFromState(section, field, noteId);

  // Optimistic
  chip?.classList.add('note-chip--removing');
  removeNoteFromState(section, field, noteId);
  chip?.addEventListener('transitionend', () => chip.remove(), { once: true });

  try {
    await del(`/projects/${projectId}/notes/${noteId}`);
  } catch (e) {
    addNoteToState(section, field, savedNote);
    toast.error(e.message);
    // Re-render affected field
    const canvas = state.canvas;
    const notesEl = document.getElementById(`notes-${section}-${field}`);
    if (notesEl) {
      const secSchema = CANVAS_SCHEMA.find(s => s.key === section);
      const notes = (canvas[section]?.[field] ?? []).sort((a,b) => a.order-b.order);
      notesEl.innerHTML = notes.map(n => renderNote(n, secSchema?.color)).join('');
    }
  }
}

// ── Drag & Drop Reorder ───────────────────────────────────────────────

function initDragDrop(projectId) {
  const grid = document.getElementById('canvas-grid');
  if (!grid) return;

  let dragSrc = null, dragSrcList = null;

  grid.addEventListener('dragstart', e => {
    const chip = e.target.closest('.note-chip');
    if (!chip) return;
    dragSrc = chip;
    dragSrcList = chip.closest('.notes-list');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', chip.dataset.id);
    requestAnimationFrame(() => chip.classList.add('note-chip--dragging'));
  });

  grid.addEventListener('dragover', e => {
    e.preventDefault();
    const target = e.target.closest('.note-chip');
    if (!target || target === dragSrc || target.closest('.notes-list') !== dragSrcList) return;
    e.dataTransfer.dropEffect = 'move';
    const rect = target.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    target.classList.toggle('drop-above', e.clientY < mid);
    target.classList.toggle('drop-below', e.clientY >= mid);
  });

  grid.addEventListener('dragleave', e => {
    e.target.closest('.note-chip')?.classList.remove('drop-above', 'drop-below');
  });

  grid.addEventListener('dragend', e => {
    dragSrc?.classList.remove('note-chip--dragging');
    grid.querySelectorAll('.note-chip').forEach(c => c.classList.remove('drop-above', 'drop-below'));
    dragSrc = null; dragSrcList = null;
  });

  grid.addEventListener('drop', e => {
    e.preventDefault();
    const target = e.target.closest('.note-chip');
    if (!target || target === dragSrc || !dragSrc) return;
    target.classList.remove('drop-above', 'drop-below');

    const list = dragSrc.closest('.notes-list');
    const rect = target.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    list.insertBefore(dragSrc, before ? target : target.nextSibling);

    reorderAndPatch(list, projectId);
  });
}

async function reorderAndPatch(listEl, projectId) {
  const { section, field } = listEl.dataset;
  const chips = [...listEl.querySelectorAll('.note-chip')];
  const canvas = state.canvas;
  const notes = canvas[section]?.[field] ?? [];
  const snapshot = notes.map(n => ({ ...n }));

  // Update orders optimistically
  const patches = [];
  chips.forEach((chip, i) => {
    const id = chip.dataset.id;
    const note = notes.find(n => n.id === id);
    if (note && note.order !== i) {
      note.order = i;
      patches.push({ id, order: i });
    }
  });

  try {
    await Promise.all(patches.map(({ id, order }) =>
      patch(`/projects/${projectId}/notes/${id}`, { order })
    ));
  } catch (e) {
    // Rollback
    if (canvas[section]) canvas[section][field] = snapshot;
    const sec = CANVAS_SCHEMA.find(s => s.key === section);
    listEl.innerHTML = snapshot.sort((a,b) => a.order-b.order).map(n => renderNote(n, sec?.color)).join('');
    toast.error('Reorder failed — changes rolled back.');
  }
}

// ── Canvas Header ─────────────────────────────────────────────────────

function renderCanvasHeader(project) {
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
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="#/projects" class="breadcrumb__item">Projects</a>
          <span class="breadcrumb__sep" aria-hidden="true">›</span>
          <span class="breadcrumb__item breadcrumb__item--current" id="bc-project-name"
                contenteditable="true" spellcheck="false"
                role="textbox" aria-label="Project name (editable)"
                data-original="${escAttr(project.name)}">${escHtml(project.name)}</span>
        </nav>
      </div>
      <div class="app-header__right">
        <button class="icon-btn theme-toggle" id="theme-toggle" title="Toggle theme">
          ${theme === 'dark' ? sunIconSm() : moonIconSm()}
        </button>
        ${user ? `
          <div class="user-menu">
            ${user.photoURL
              ? `<img src="${user.photoURL}" class="user-avatar" alt="${escAttr(user.displayName || 'User')}" referrerpolicy="no-referrer">`
              : `<div class="user-avatar user-avatar--initials">${(user.displayName||user.email||'U')[0].toUpperCase()}</div>`}
            <button class="btn btn--ghost btn--sm" id="btn-signout">Sign out</button>
          </div>` : ''}
      </div>
    </header>`;
}

function bindCanvasHeader(project) {
  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const { toggleTheme } = window._projectsView || {};
    const next = state.theme === 'dark' ? 'light' : 'dark';
    set('theme', next);
    localStorage.setItem('growthos_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    document.getElementById('theme-toggle').innerHTML = next === 'dark' ? sunIconSm() : moonIconSm();
  });

  document.getElementById('btn-signout')?.addEventListener('click', async () => {
    const { signOut } = await import('../auth.js');
    await signOut();
  });

  // Inline project rename
  const nameEl = document.getElementById('bc-project-name');
  if (!nameEl) return;
  nameEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
    if (e.key === 'Escape') { nameEl.textContent = nameEl.dataset.original; nameEl.blur(); }
  });
  nameEl.addEventListener('blur', async () => {
    const newName = nameEl.textContent.trim();
    const original = nameEl.dataset.original;
    if (!newName || newName === original) { nameEl.textContent = original; return; }
    try {
      const updated = await patch(`/projects/${project.id}`, { name: newName });
      set('currentProject', updated);
      nameEl.dataset.original = newName;
      toast.success('Project renamed');
    } catch (e) {
      nameEl.textContent = original;
      toast.error(e.message);
    }
  });
}

function sunIconSm()  { return `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="8" r="3"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M11.89 4.11l1.06-1.06M3.05 12.95l1.06-1.06"/></svg>`; }
function moonIconSm() { return `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13.5 10.5A6 6 0 015.5 2.5a6 6 0 108 8z"/></svg>`; }

// ── State Helpers ─────────────────────────────────────────────────────

function addNoteToState(section, field, note) {
  const c = state.canvas;
  if (!c[section]) c[section] = {};
  if (!c[section][field]) c[section][field] = [];
  c[section][field].push(note);
}

function removeNoteFromState(section, field, noteId) {
  const c = state.canvas;
  if (c[section]?.[field]) {
    c[section][field] = c[section][field].filter(n => n.id !== noteId);
  }
}

function replaceNoteInState(section, field, tempId, real) {
  const c = state.canvas;
  if (c[section]?.[field]) {
    const idx = c[section][field].findIndex(n => n.id === tempId);
    if (idx !== -1) c[section][field][idx] = real;
  }
}

function updateNoteInState(section, field, noteId, updated) {
  const c = state.canvas;
  if (c[section]?.[field]) {
    const idx = c[section][field].findIndex(n => n.id === noteId);
    if (idx !== -1) c[section][field][idx] = updated;
  }
}

function getNoteFromState(section, field, noteId) {
  return state.canvas?.[section]?.[field]?.find(n => n.id === noteId) || null;
}

function findNotePosition(noteId) {
  for (const sec of CANVAS_SCHEMA) {
    const fields = state.canvas?.[sec.key] || {};
    for (const [field, notes] of Object.entries(fields)) {
      if ((notes || []).some(n => n.id === noteId)) return { section: sec.key, field };
    }
  }
  return { section: '', field: '' };
}

function getSectionForNote(noteId) {
  return findNotePosition(noteId).section;
}

function countSectionNotes(canvas, sectionKey) {
  const sec = canvas[sectionKey] || {};
  const total = Object.values(sec).reduce((s, notes) => s + (notes?.length ?? 0), 0);
  return total > 0 ? total : '';
}

// ── DOM Helpers ───────────────────────────────────────────────────────

function appendNoteToDOM(section, field, note) {
  const list = document.getElementById(`notes-${section}-${field}`);
  if (!list) return;
  const sec = CANVAS_SCHEMA.find(s => s.key === section);
  const el = document.createElement('div');
  el.innerHTML = renderNote(note, sec?.color);
  const chip = el.firstElementChild;
  chip.classList.add('note-chip--entering');
  list.appendChild(chip);
  requestAnimationFrame(() => chip.classList.remove('note-chip--entering'));
}

function bindChipActions(chip, projectId) {
  chip?.querySelector('.btn-note-edit')?.addEventListener('click', () => openEditForm(chip.dataset.id, projectId));
  chip?.querySelector('.btn-note-delete')?.addEventListener('click', e => confirmDeleteNote(e.currentTarget, projectId));
}
