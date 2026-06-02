import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from 'firebase/auth';
import { Project, Canvas } from '../models/canvas.models';

@Injectable({ providedIn: 'root' })
export class StateService {
  private _user    = new BehaviorSubject<User | null>(null);
  private _token   = new BehaviorSubject<string | null>(null);
  private _projects = new BehaviorSubject<Project[]>([]);
  private _currentProject = new BehaviorSubject<Project | null>(null);
  private _canvas  = new BehaviorSubject<Canvas | null>(null);
  private _theme   = new BehaviorSubject<'dark' | 'light'>(
    (localStorage.getItem('growthos_theme') as 'dark' | 'light') || 'dark'
  );

  readonly user$           = this._user.asObservable();
  readonly token$          = this._token.asObservable();
  readonly projects$       = this._projects.asObservable();
  readonly currentProject$ = this._currentProject.asObservable();
  readonly canvas$         = this._canvas.asObservable();
  readonly theme$          = this._theme.asObservable();

  get userSnapshot()           { return this._user.value; }
  get tokenSnapshot()          { return this._token.value; }
  get projectsSnapshot()       { return this._projects.value; }
  get currentProjectSnapshot() { return this._currentProject.value; }
  get canvasSnapshot()         { return this._canvas.value; }
  get themeSnapshot()          { return this._theme.value; }

  setUser(u: User | null)       { this._user.next(u); }
  setToken(t: string | null)    { this._token.next(t); }
  setProjects(p: Project[])     { this._projects.next(p); }
  setCurrentProject(p: Project | null) { this._currentProject.next(p); }
  setCanvas(c: Canvas | null)   { this._canvas.next(c); }

  setTheme(t: 'dark' | 'light') {
    this._theme.next(t);
    localStorage.setItem('growthos_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }

  toggleTheme() {
    this.setTheme(this._theme.value === 'dark' ? 'light' : 'dark');
  }

  /** Mutate canvas in-place and push a new reference for change detection */
  patchCanvas(fn: (c: Canvas) => void) {
    const c = { ...this._canvas.value } as Canvas;
    fn(c);
    this._canvas.next(c);
  }
}
