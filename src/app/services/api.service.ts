import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Project, Note, Canvas } from '../models/canvas.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  // ── Projects ─────────────────────────────────────────────────
  getProjects(): Observable<Project[]>         { return this.http.get<Project[]>(`${this.base}/projects`); }
  getProject(id: string): Observable<Project>  { return this.http.get<Project>(`${this.base}/projects/${id}`); }
  createProject(name: string): Observable<Project> {
    return this.http.post<Project>(`${this.base}/projects`, { name });
  }
  renameProject(id: string, name: string): Observable<Project> {
    return this.http.patch<Project>(`${this.base}/projects/${id}`, { name });
  }
  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/projects/${id}`);
  }

  // ── Canvas ────────────────────────────────────────────────────
  getCanvas(projectId: string): Observable<Canvas> {
    return this.http.get<Canvas>(`${this.base}/projects/${projectId}/canvas`);
  }

  // ── Notes ─────────────────────────────────────────────────────
  createNote(projectId: string, body: Partial<Note>): Observable<Note> {
    return this.http.post<Note>(`${this.base}/projects/${projectId}/notes`, body);
  }
  patchNote(projectId: string, noteId: string, body: Partial<Note>): Observable<Note> {
    return this.http.patch<Note>(`${this.base}/projects/${projectId}/notes/${noteId}`, body);
  }
  deleteNote(projectId: string, noteId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/projects/${projectId}/notes/${noteId}`);
  }
}
