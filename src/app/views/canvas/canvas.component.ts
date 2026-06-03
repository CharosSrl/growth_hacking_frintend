import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { ToastService } from '../../services/toast.service';
import { HeaderComponent } from '../../components/header/header.component';
import { Note, Canvas, CANVAS_SCHEMA, SectionSchema } from '../../models/canvas.models';

interface EditState { noteId: string; content: string; }
interface AddState  { section: string; field: string; content: string; }

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [FormsModule, RouterLink, HeaderComponent, NgbDropdownModule],
  animations: [
    trigger('fields', [
      transition('* => *', [
        query('.field-block:enter', [
          style({ opacity: 0, transform: 'translateY(8px)' }),
          stagger(45, animate('240ms ease', style({ opacity: 1, transform: 'none' }))),
        ], { optional: true }),
      ]),
    ]),
  ],
  template: `
    <div class="page canvas-page">
      <app-header>
        <nav breadcrumb class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/projects" class="breadcrumb__item">Projects</a>
          <span class="breadcrumb__sep" aria-hidden="true">›</span>
          <span class="breadcrumb__item breadcrumb__item--current"
                [attr.contenteditable]="true" spellcheck="false"
                role="textbox" aria-label="Project name (editable)"
                (keydown.enter)="$event.preventDefault(); renameProject($event)"
                (keydown.escape)="cancelRename($event)"
                (blur)="renameProject($event)">{{ projectName }}</span>
        </nav>
      </app-header>

      <main class="page__main">
        @if (loading) {
          <div class="canvas-layout">
            <aside class="canvas-nav" aria-hidden="true">
              @for (s of schema; track s.key) {
                <div class="canvas-nav__item canvas-nav__item--skeleton">
                  <span class="skeleton skeleton--dot"></span>
                  <span class="skeleton skeleton--label" style="width:96px"></span>
                </div>
              }
            </aside>
            <div class="section-page">
              <div class="skeleton skeleton--label" style="width:200px;height:24px"></div>
              <div class="field-block field-block--skeleton">
                <div class="skeleton skeleton--label" style="width:140px"></div>
                <div class="skeleton skeleton--note"></div>
                <div class="skeleton skeleton--note"></div>
              </div>
              <div class="field-block field-block--skeleton">
                <div class="skeleton skeleton--label" style="width:120px"></div>
                <div class="skeleton skeleton--note"></div>
              </div>
            </div>
          </div>
        } @else {
          <div class="canvas-layout">
            <!-- ── Section navigation ─────────────────────────────── -->
            <aside class="canvas-nav" aria-label="Canvas sections">
              <!-- Mobile: dropdown section picker (ng-bootstrap) -->
              <div class="canvas-nav__picker" ngbDropdown display="static">
                <button class="section-picker-toggle" ngbDropdownToggle
                        [style.--sec-color]="active.color" aria-label="Select section">
                  <span class="canvas-nav__icon" aria-hidden="true">{{ active.icon }}</span>
                  <span class="canvas-nav__label">{{ active.label }}</span>
                  @if (sectionCount(active.key)) {
                    <span class="canvas-nav__count">{{ sectionCount(active.key) }}</span>
                  }
                  <svg class="section-picker-chevron" width="14" height="14" viewBox="0 0 16 16"
                       fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div ngbDropdownMenu class="section-picker-menu" aria-label="Sections">
                  @for (sec of schema; track sec.key) {
                    <button ngbDropdownItem class="section-picker-item"
                            [class.active]="activeSection === sec.key"
                            [style.--sec-color]="sec.color"
                            (click)="selectSection(sec.key)">
                      <span class="canvas-nav__icon" aria-hidden="true">{{ sec.icon }}</span>
                      <span class="section-picker-item__label">{{ sec.label }}</span>
                      @if (sectionCount(sec.key)) {
                        <span class="canvas-nav__count">{{ sectionCount(sec.key) }}</span>
                      }
                    </button>
                  }
                </div>
              </div>

              <div class="canvas-nav__list" role="tablist" aria-orientation="vertical">
                @for (sec of schema; track sec.key) {
                  <button class="canvas-nav__item" role="tab"
                          [class.canvas-nav__item--active]="activeSection === sec.key"
                          [attr.aria-selected]="activeSection === sec.key"
                          [style.--sec-color]="sec.color"
                          (click)="selectSection(sec.key)">
                    <span class="canvas-nav__icon" aria-hidden="true">{{ sec.icon }}</span>
                    <span class="canvas-nav__label">{{ sec.label }}</span>
                    @if (sectionCount(sec.key)) {
                      <span class="canvas-nav__count">{{ sectionCount(sec.key) }}</span>
                    }
                  </button>
                }
              </div>
              <div class="canvas-nav__foot">
                <button class="btn btn--secondary btn--full" (click)="exportPdf()"
                        [disabled]="totalNotes() === 0" title="Export the full canvas as a PDF report">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
                    <path d="M8 1v9M4.5 6.5L8 10l3.5-3.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 11v2.5h12V11" stroke-linecap="round"/>
                  </svg>
                  Export as PDF
                </button>
              </div>
            </aside>

            <!-- ── Active section ─────────────────────────────────── -->
            <section class="section-page" [style.--sec-color]="active.color"
                     [attr.aria-labelledby]="'sp-'+active.key">
              <header class="section-page__header">
                <span class="section-page__icon" aria-hidden="true">{{ active.icon }}</span>
                <div>
                  <h1 class="section-page__title" id="sp-{{active.key}}">{{ active.label }}</h1>
                  <p class="section-page__sub">
                    {{ active.fields.length }} fields ·
                    {{ sectionCount(active.key) }} {{ sectionCount(active.key) === 1 ? 'note' : 'notes' }}
                  </p>
                </div>
              </header>

              <div class="field-stack" [@fields]="activeSection">
                @for (field of active.fields; track field.key) {
                  <div class="field-block">
                    <div class="field-block__label">{{ field.label }}</div>
                    <div class="notes-list" role="list"
                         [id]="'nl-'+active.key+'-'+field.key"
                         (dragover)="onDragOver($event)"
                         (drop)="onDrop($event, active.key, field.key)">
                      @for (note of fieldNotes(active.key, field.key); track note.id; let i = $index) {
                        @if (editing?.noteId === note.id) {
                          <div class="note-chip note-chip--editing">
                            <textarea class="note-textarea" [(ngModel)]="editing!.content" rows="3"
                              (keydown.control.enter)="saveEdit(active.key, field.key)"
                              (keydown.meta.enter)="saveEdit(active.key, field.key)"
                              (keydown.escape)="editing = null"
                              autofocus></textarea>
                            <div class="add-note-form__actions">
                              <button class="btn btn--secondary btn--sm" (click)="editing = null">Cancel</button>
                              <button class="btn btn--primary btn--sm" (click)="saveEdit(active.key, field.key)">Save</button>
                            </div>
                          </div>
                        } @else {
                          <div class="note-chip" [id]="'note-'+note.id" [attr.data-id]="note.id"
                               role="listitem" draggable="true" tabindex="0"
                               [attr.aria-label]="note.content + '. Note ' + (i + 1) + ' of ' + fieldNotes(active.key, field.key).length + '. Press Alt plus Arrow Up or Down to reorder.'"
                               (dragstart)="onDragStart($event, note)"
                               (dragend)="dragNote = null"
                               (keydown.alt.arrowup)="moveNote($event, active.key, field.key, note, -1)"
                               (keydown.alt.arrowdown)="moveNote($event, active.key, field.key, note, 1)">
                            <span class="note-chip__drag" aria-hidden="true">⠿</span>
                            <span class="note-chip__text">{{ note.content }}</span>
                            <div class="note-chip__actions">
                              <button class="note-action-btn" (click)="startEdit(note)" title="Edit" aria-label="Edit note">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 1.5l2.5 2.5-7 7H1v-2.5l7-7z"/></svg>
                              </button>
                              @if (confirmDel === note.id) {
                                <button class="note-action-btn btn-note-delete" (click)="doDelete(note, active.key, field.key)">✕ Delete</button>
                                <button class="note-action-btn" (click)="confirmDel = null">No</button>
                              } @else {
                                <button class="note-action-btn btn-note-delete" (click)="confirmDel = note.id" title="Delete" aria-label="Delete note">
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 3h10M3.5 3V2h5v1M2 3l1 8h6l1-8"/></svg>
                                </button>
                              }
                            </div>
                          </div>
                        }
                      }
                      @if (!fieldNotes(active.key, field.key).length && !(adding?.section === active.key && adding?.field === field.key)) {
                        <p class="field-block__empty">No notes yet.</p>
                      }
                    </div>

                    @if (adding?.section === active.key && adding?.field === field.key) {
                      <div class="add-note-form">
                        <textarea class="note-textarea" [(ngModel)]="adding!.content" rows="2"
                          [placeholder]="'Add a note to ' + field.label + '…'"
                          (keydown.control.enter)="submitNote(active.key, field.key)"
                          (keydown.meta.enter)="submitNote(active.key, field.key)"
                          (keydown.escape)="adding = null"
                          autofocus></textarea>
                        <div class="add-note-form__actions">
                          <button class="btn btn--secondary btn--sm" (click)="adding = null">Cancel</button>
                          <button class="btn btn--primary btn--sm" (click)="submitNote(active.key, field.key)" [disabled]="!adding!.content.trim()">Add</button>
                        </div>
                      </div>
                    } @else {
                      <button class="btn-add-note" (click)="startAdd(active.key, field.key)"
                              [attr.aria-label]="'Add note to ' + field.label">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 1v10M1 6h10"/></svg>
                        Add note
                      </button>
                    }
                  </div>
                }
              </div>
            </section>
          </div>

          <!-- ── Print-only full report (Export as PDF) ──────────── -->
          <div class="print-report" aria-hidden="true">
            <div class="print-report__head">
              <h1>{{ projectName }}</h1>
              <p>GrowthOS — Growth Strategy Canvas · {{ today }}</p>
            </div>
            @for (sec of schema; track sec.key) {
              <section class="print-section" [style.--sec-color]="sec.color">
                <h2>{{ sec.icon }} {{ sec.label }}</h2>
                @for (field of sec.fields; track field.key) {
                  <div class="print-field">
                    <h3>{{ field.label }}</h3>
                    @if (fieldNotes(sec.key, field.key).length) {
                      <ul>
                        @for (note of fieldNotes(sec.key, field.key); track note.id) {
                          <li>{{ note.content }}</li>
                        }
                      </ul>
                    } @else {
                      <p class="print-field__empty">—</p>
                    }
                  </div>
                }
              </section>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class CanvasComponent implements OnInit {
  readonly schema = CANVAS_SCHEMA;
  canvas: Canvas | null = null;
  loading = true;
  projectId = '';
  projectName = '';
  activeSection = CANVAS_SCHEMA[0].key;
  editing: EditState | null = null;
  adding: AddState | null = null;
  confirmDel: string | null = null;
  dragNote: Note | null = null;
  readonly today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public state: StateService,
    private toast: ToastService,
    private router: Router,
  ) {}

  get active(): SectionSchema {
    return this.schema.find(s => s.key === this.activeSection) ?? this.schema[0];
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id')!;
    const cached = this.state.currentProjectSnapshot;
    this.projectName = cached?.id === this.projectId ? cached.name : 'Loading…';

    if (!cached || cached.id !== this.projectId) {
      this.api.getProject(this.projectId).subscribe({
        next: p => { this.state.setCurrentProject(p); this.projectName = p.name; },
        error: () => { this.toast.error('Project not found.'); this.router.navigate(['/projects']); },
      });
    }

    this.api.getCanvas(this.projectId).subscribe({
      next: c => { this.canvas = c; this.state.setCanvas(c); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  // ── Navigation ───────────────────────────────────────────────────

  selectSection(key: string) {
    if (this.activeSection === key) return;
    this.activeSection = key;
    this.editing = null;
    this.adding = null;
    this.confirmDel = null;
  }

  // ── Helpers ─────────────────────────────────────────────────────

  fieldNotes(sec: string, field: string): Note[] {
    return (this.canvas?.[sec]?.[field] ?? []).slice().sort((a, b) => a.order - b.order);
  }

  sectionCount(sec: string): number {
    const s = this.canvas?.[sec] || {};
    return Object.values(s).reduce((n, arr) => n + (arr?.length ?? 0), 0);
  }

  totalNotes(): number {
    return this.schema.reduce((n, s) => n + this.sectionCount(s.key), 0);
  }

  // ── Export as PDF (browser print → Save as PDF) ───────────────

  exportPdf() {
    if (this.totalNotes() === 0) return;
    const restore = document.title;
    document.title = `${this.projectName} — GrowthOS Canvas`;
    const after = () => { document.title = restore; window.removeEventListener('afterprint', after); };
    window.addEventListener('afterprint', after);
    window.print();
  }

  // ── Rename project ────────────────────────────────────────────

  renameProject(event: Event) {
    const el = event.target as HTMLElement;
    const newName = el.textContent?.trim() ?? '';
    const original = this.state.currentProjectSnapshot?.name ?? '';
    if (!newName || newName === original) { el.textContent = original; return; }
    this.api.renameProject(this.projectId, newName).subscribe({
      next: p => { this.state.setCurrentProject(p); this.projectName = p.name; this.toast.success('Renamed'); },
      error: () => { el.textContent = original; },
    });
  }

  cancelRename(event: Event) {
    const el = event.target as HTMLElement;
    el.textContent = this.state.currentProjectSnapshot?.name ?? '';
    el.blur();
  }

  // ── Add note ──────────────────────────────────────────────────

  startAdd(sec: string, field: string) {
    this.adding = { section: sec, field, content: '' };
    this.editing = null;
  }

  submitNote(sec: string, field: string) {
    const content = this.adding?.content.trim();
    if (!content) return;
    const notes = this.canvas?.[sec]?.[field] ?? [];
    const order = notes.length;
    const tempId = '_tmp_' + Date.now();
    const temp: Note = { id: tempId, project_id: this.projectId, section: sec, field, content, order, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

    // Optimistic
    if (!this.canvas![sec]) this.canvas![sec] = {};
    if (!this.canvas![sec][field]) this.canvas![sec][field] = [];
    this.canvas![sec][field].push(temp);
    this.canvas = { ...this.canvas! };
    this.adding = null;

    this.api.createNote(this.projectId, { section: sec, field, content, order }).subscribe({
      next: real => {
        const arr = this.canvas![sec][field];
        const i = arr.findIndex(n => n.id === tempId);
        if (i !== -1) arr[i] = real;
        this.canvas = { ...this.canvas! };
      },
      error: () => {
        this.canvas![sec][field] = this.canvas![sec][field].filter(n => n.id !== tempId);
        this.canvas = { ...this.canvas! };
      },
    });
  }

  // ── Edit note ─────────────────────────────────────────────────

  startEdit(note: Note) { this.editing = { noteId: note.id, content: note.content }; this.adding = null; }

  saveEdit(sec: string, field: string) {
    const content = this.editing?.content.trim();
    const noteId = this.editing?.noteId;
    if (!content || !noteId) return;
    this.editing = null;

    const arr = this.canvas![sec]?.[field];
    const i = arr?.findIndex(n => n.id === noteId) ?? -1;
    const prev = arr?.[i];
    if (i !== -1) { arr[i] = { ...arr[i], content }; this.canvas = { ...this.canvas! }; }

    this.api.patchNote(this.projectId, noteId, { content }).subscribe({
      next: updated => { if (i !== -1) { arr[i] = updated; this.canvas = { ...this.canvas! }; } },
      error: () => { if (i !== -1 && prev) { arr[i] = prev; this.canvas = { ...this.canvas! }; } },
    });
  }

  // ── Delete note ───────────────────────────────────────────────

  doDelete(note: Note, sec: string, field: string) {
    this.confirmDel = null;
    const arr = this.canvas![sec]?.[field];
    const i = arr?.findIndex(n => n.id === note.id) ?? -1;
    if (i !== -1) { arr.splice(i, 1); this.canvas = { ...this.canvas! }; }

    this.api.deleteNote(this.projectId, note.id).subscribe({
      error: () => { if (i !== -1) { arr.splice(i, 0, note); this.canvas = { ...this.canvas! }; } },
    });
  }

  // ── Drag & Drop ───────────────────────────────────────────────

  onDragStart(event: DragEvent, note: Note) {
    this.dragNote = note;
    event.dataTransfer?.setData('text/plain', note.id);
    (event.target as HTMLElement).classList.add('note-chip--dragging');
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  onDrop(event: DragEvent, sec: string, field: string) {
    event.preventDefault();
    if (!this.dragNote || this.dragNote.section !== sec || this.dragNote.field !== field) return;
    const target = (event.target as HTMLElement).closest('.note-chip') as HTMLElement;
    if (!target) return;
    const targetId = target.dataset['id'];
    const arr = this.canvas![sec]?.[field];
    if (!arr) return;
    const fromIdx = arr.findIndex(n => n.id === this.dragNote!.id);
    const toIdx   = arr.findIndex(n => n.id === targetId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

    const prev = new Map(arr.map(n => [n.id, n.order]));
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    arr.forEach((n, i) => n.order = i);
    this.canvas = { ...this.canvas! };
    this.persistOrders(arr, prev);
  }

  // ── Keyboard reorder (drag-and-drop fallback) ─────────────────

  moveNote(event: Event, sec: string, field: string, note: Note, dir: -1 | 1) {
    event.preventDefault();
    const sorted = this.fieldNotes(sec, field);          // shares Note references
    const idx = sorted.findIndex(n => n.id === note.id);
    const swapIdx = idx + dir;
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx], b = sorted[swapIdx];
    const prev = new Map<string, number>([[a.id, a.order], [b.id, b.order]]);
    [a.order, b.order] = [b.order, a.order];             // swap; display re-sorts by order
    this.canvas = { ...this.canvas! };

    // Keep focus on the note the user is moving after re-render
    setTimeout(() => document.getElementById('note-' + note.id)?.focus(), 0);
    this.persistOrders([a, b], prev);
  }

  /** PATCH only the notes whose order actually changed; rollback all on failure */
  private persistOrders(notes: Note[], prev: Map<string, number>) {
    for (const n of notes) {
      if (prev.get(n.id) === n.order || n.id.startsWith('_tmp_')) continue;
      this.api.patchNote(this.projectId, n.id, { order: n.order }).subscribe({
        error: () => {
          notes.forEach(m => { const o = prev.get(m.id); if (o !== undefined) m.order = o; });
          this.canvas = { ...this.canvas! };
          this.toast.error('Could not save new order.');
        },
      });
    }
  }
}
