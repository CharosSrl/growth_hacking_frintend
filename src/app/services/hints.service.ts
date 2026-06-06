import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HintsData } from '../models/canvas.models';

/**
 * Loads educational hints from assets/hints.json at runtime.
 *
 * The hint content lives entirely in that file — edit it (and redeploy) to change
 * what users see; no component changes are needed. Accessors return empty values
 * until the file has loaded, so templates stay null-safe; the HttpClient response
 * runs inside Angular's zone, so the view re-renders automatically when data lands.
 */
@Injectable({ providedIn: 'root' })
export class HintsService {
  data: HintsData = {};
  loaded = false;

  constructor(private http: HttpClient) {
    // Absolute path → always /assets/hints.json regardless of the current route
    // (a relative path resolves against deep routes like /canvas/:id and 404s).
    this.http.get<HintsData>('/assets/hints.json').subscribe({
      next: d => { this.data = d ?? {}; this.loaded = true; },
      error: () => { this.loaded = true; },   // fail soft: hints simply don't show
    });
  }

  summary(section: string): string {
    return this.data[section]?.summary ?? '';
  }

  about(section: string): string {
    return this.data[section]?.about ?? '';
  }

  fieldHints(section: string, field: string): string[] {
    return this.data[section]?.fields?.[field] ?? [];
  }
}
