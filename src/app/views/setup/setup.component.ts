import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="auth-screen">
      <div class="auth-bg"></div>
      <div class="auth-card auth-card--wide">
        <div class="auth-card__icon auth-card__icon--warning">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M10 2L18.5 17H1.5L10 2z"/><path d="M10 9v3M10 14.5v.5"/>
          </svg>
        </div>
        <h1 class="auth-card__title">Connect Firebase</h1>
        <p class="auth-card__sub">
          Paste your <code>firebaseConfig</code> from the Firebase Console.<br>
          Stored locally in your browser only.
        </p>
        <ol class="setup-steps">
          <li>Firebase Console → your project → <strong>Project settings</strong></li>
          <li>Scroll to <strong>Your apps</strong> → select or create a Web app</li>
          <li>Copy the <code>firebaseConfig</code> object and paste below</li>
        </ol>
        <textarea class="setup-textarea"
          [(ngModel)]="input"
          (ngModelChange)="onInput()"
          [class.ok]="parsed"
          [class.bad]="error && input.trim()"
          placeholder="const firebaseConfig = {&#10;  apiKey: &quot;AIza...&quot;,&#10;  ...&#10;};"
          spellcheck="false"
          autocomplete="off"
          rows="6"></textarea>
        <div class="setup-preview">
          @for (f of previewFields; track f) {
            <span class="setup-chip">✓ {{ f }}</span>
          }
        </div>
        <p class="setup-error" role="alert">{{ error }}</p>
        <button class="btn btn--primary btn--full" (click)="connect()" [disabled]="!parsed || loading">
          @if (loading) { <span class="spinner"></span> }
          Connect Firebase
        </button>
      </div>
    </div>
  `,
})
export class SetupComponent {
  input = '';
  parsed: Record<string, string> | null = null;
  error = '';
  loading = false;
  previewFields: string[] = [];

  constructor(private auth: AuthService, private toast: ToastService, private router: Router) {}

  onInput() {
    this.error = '';
    const t = this.input.trim();
    if (!t) { this.parsed = null; this.previewFields = []; return; }
    this.parsed = this.parse(t);
    if (this.parsed) {
      this.previewFields = ['projectId', 'authDomain', 'appId'].filter(k => this.parsed![k]);
    } else {
      this.previewFields = [];
      this.error = 'Could not parse config — paste the full firebaseConfig object.';
    }
  }

  async connect() {
    if (!this.parsed) return;
    this.loading = true;
    try {
      this.auth.reinitWithConfig(this.parsed);
      this.toast.success('Firebase connected!');
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error = 'Initialization failed: ' + (e.message || 'unknown error');
    } finally {
      this.loading = false;
    }
  }

  private parse(text: string): Record<string, string> | null {
    try {
      const c = JSON.parse(text);
      if (c?.apiKey && !c.apiKey.startsWith('YOUR_')) return c;
    } catch {}
    const keys = ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId','measurementId'];
    const out: Record<string, string> = {};
    for (const k of keys) {
      const m = text.match(new RegExp(k + '\\s*:\\s*["\`\']((?:[^"\`\'\\\\]|\\\\.)*)'));
      if (m) out[k] = m[1];
    }
    return (out['apiKey'] && !out['apiKey'].startsWith('YOUR_')) ? out : null;
  }
}
