import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { ToastService } from '../../services/toast.service';
import { HeaderComponent } from '../../components/header/header.component';
import { Project } from '../../models/canvas.models';

const ACCENT_COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [FormsModule, HeaderComponent],
  animations: [
    trigger('list', [
      transition('* => *', [
        query('.project-card:enter', [
          style({ opacity: 0, transform: 'translateY(8px)' }),
          stagger(40, animate('220ms ease', style({ opacity: 1, transform: 'none' }))),
        ], { optional: true }),
      ]),
    ]),
  ],
  template: `
    <div class="page projects-page">
      <app-header></app-header>
      <main class="page__main">
        <div class="projects-toolbar">
          <div>
            <h1 class="page-title">Projects</h1>
            <p class="page-sub">Your growth strategy canvases</p>
          </div>
          <div class="projects-toolbar__right">
            <div class="project-limit">
              <div class="limit-track" [title]="projects.length + '/10'">
                <div class="limit-fill"
                  [class.limit-fill--warn]="projects.length >= 8"
                  [class.limit-fill--full]="projects.length >= 10"
                  [style.width.%]="projects.length * 10"></div>
              </div>
              <span class="limit-label">{{ projects.length }}/10</span>
            </div>
            <button class="btn btn--primary" (click)="openCreateModal()" [disabled]="projects.length >= 10">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M6 1v10M1 6h10"/>
              </svg>
              New project
            </button>
          </div>
        </div>

        @if (loading) {
          <div class="projects-grid">
            @for (sk of [1,2,3,4,5,6]; track sk) {
              <div class="project-card project-card--skeleton">
                <div class="skeleton skeleton--icon"></div>
                <div class="skeleton skeleton--title"></div>
                <div class="skeleton skeleton--text"></div>
              </div>
            }
          </div>
        } @else if (projects.length === 0) {
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
            <button class="btn btn--primary" (click)="openCreateModal()">Create project</button>
          </div>
        } @else {
          <div class="projects-grid" [@list]="projects.length">
            @for (p of projects; track p.id; let i = $index) {
              <article class="project-card" [style.--card-accent]="color(i)"
                       tabindex="0" role="button" [attr.aria-label]="'Open ' + p.name"
                       (click)="open(p)" (keydown.enter)="open(p)">
                <div class="project-card__accent"></div>
                <div class="project-card__body">
                  <div class="project-card__icon" [style.background]="color(i) + '20'" [style.color]="color(i)">
                    {{ p.name.slice(0,2).toUpperCase() }}
                  </div>
                  @if (renaming === p.id) {
                    <input class="card-inline-input" [(ngModel)]="renameVal"
                      (keydown.enter)="confirmRename(p)"
                      (keydown.escape)="renaming = null"
                      (blur)="confirmRename(p)"
                      (click)="$event.stopPropagation()"
                      maxlength="100" [attr.aria-label]="'Rename ' + p.name">
                  } @else {
                    <div class="project-card__name">{{ p.name }}</div>
                  }
                  <div class="project-card__meta">Created {{ fmt(p.created_at) }}</div>
                </div>
                <div class="project-card__footer">
                  <div class="project-card__actions">
                    @if (confirmDelete === p.id) {
                      <span class="inline-confirm">
                        Delete?
                        <button class="btn btn--danger btn--xs" (click)="doDelete(p); $event.stopPropagation()">Yes</button>
                        <button class="btn btn--secondary btn--xs" (click)="confirmDelete = null; $event.stopPropagation()">No</button>
                      </span>
                    } @else {
                      <button class="icon-btn" title="Rename" (click)="startRename(p); $event.stopPropagation()" aria-label="Rename">
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8z"/></svg>
                      </button>
                      <button class="icon-btn" title="Delete" (click)="confirmDelete = p.id; $event.stopPropagation()" aria-label="Delete">
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1.5 3.5h11M4.5 3.5V2h5v1.5M5 6v5M9 6v5M2.5 3.5l1 9h7l1-9"/></svg>
                      </button>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </main>

      @if (showModal) {
        <div class="modal-overlay modal-overlay--visible" (click)="showModal = false">
          <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="modal__header">
              <h2 class="modal__title" id="modal-title">New project</h2>
              <button class="modal__close icon-btn" (click)="showModal = false" aria-label="Close">✕</button>
            </div>
            <div class="modal__body">
              <input class="input" [(ngModel)]="newName" placeholder="e.g. My SaaS Growth Plan"
                     maxlength="100" (keydown.enter)="createProject()" #nameInput>
            </div>
            <div class="modal__footer">
              <button class="btn btn--secondary" (click)="showModal = false">Cancel</button>
              <button class="btn btn--primary" (click)="createProject()" [disabled]="!newName.trim()">Create</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  loading = true;
  showModal = false;
  newName = '';
  renaming: string | null = null;
  renameVal = '';
  confirmDelete: string | null = null;

  constructor(
    private api: ApiService,
    public state: StateService,
    private toast: ToastService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.api.getProjects().subscribe({
      next: p => { this.projects = p; this.state.setProjects(p); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  color(i: number) { return ACCENT_COLORS[i % ACCENT_COLORS.length]; }

  fmt(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  open(p: Project) {
    if (this.renaming) return;
    this.state.setCurrentProject(p);
    this.router.navigate(['/canvas', p.id]);
  }

  openCreateModal() {
    this.newName = '';
    this.showModal = true;
    setTimeout(() => (document.querySelector('.modal input') as HTMLElement)?.focus(), 50);
  }

  createProject() {
    const name = this.newName.trim();
    if (!name) return;
    this.showModal = false;
    this.api.createProject(name).subscribe({
      next: p => { this.projects = [p, ...this.projects]; this.toast.success(`"${p.name}" created`); },
      error: () => {},
    });
  }

  startRename(p: Project) { this.renaming = p.id; this.renameVal = p.name; }

  confirmRename(p: Project) {
    const name = this.renameVal.trim();
    this.renaming = null;
    if (!name || name === p.name) return;
    const i = this.projects.findIndex(x => x.id === p.id);
    this.projects[i] = { ...p, name };
    this.api.renameProject(p.id, name).subscribe({
      next: updated => { this.projects[i] = updated; this.toast.success('Renamed'); },
      error: () => { this.projects[i] = p; },
    });
  }

  doDelete(p: Project) {
    this.confirmDelete = null;
    this.projects = this.projects.filter(x => x.id !== p.id);
    this.api.deleteProject(p.id).subscribe({
      next: () => this.toast.success(`"${p.name}" deleted`),
      error: () => { this.projects = [p, ...this.projects]; },
    });
  }
}
