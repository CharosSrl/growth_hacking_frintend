import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  initializeApp, getApps, getApp, FirebaseApp
} from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signOut, onAuthStateChanged, Auth
} from 'firebase/auth';
import { environment } from '../../environments/environment';
import { StateService } from './state.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private app!: FirebaseApp;
  private auth!: Auth;

  constructor(private state: StateService, private router: Router) {
    this.initFirebase(this.resolveConfig());
  }

  // ── Config resolution ──────────────────────────────────────────
  private resolveConfig() {
    // Prefer saved config from localStorage (setup screen)
    try {
      const saved = localStorage.getItem('growthos_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return environment.firebase;
  }

  get needsSetup(): boolean {
    return this.resolveConfig().apiKey.startsWith('YOUR_');
  }

  reinitWithConfig(cfg: Record<string, string>) {
    localStorage.setItem('growthos_config', JSON.stringify(cfg));
    this.initFirebase(cfg);
  }

  // ── Firebase init ──────────────────────────────────────────────
  private initFirebase(cfg: Record<string, string | undefined>) {
    if (cfg['apiKey']?.startsWith('YOUR_')) return;
    this.app = getApps().length ? getApp() : initializeApp(cfg as any);
    this.auth = getAuth(this.app);
    this.listenAuthState();
  }

  private listenAuthState() {
    onAuthStateChanged(this.auth, async user => {
      if (user) {
        const token = await user.getIdToken();
        this.state.setUser(user);
        this.state.setToken(token);
        const url = this.router.url;
        if (!url.startsWith('/projects') && !url.startsWith('/canvas')) {
          this.router.navigate(['/projects']);
        }
      } else {
        this.state.setUser(null);
        this.state.setToken(null);
        this.router.navigate(['/']);
      }
    });
  }

  // ── Public API ─────────────────────────────────────────────────
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async signOut() {
    await signOut(this.auth);
  }

  async refreshToken(): Promise<string | null> {
    const user = this.auth?.currentUser;
    if (user) {
      const token = await user.getIdToken(true);
      this.state.setToken(token);
      return token;
    }
    return null;
  }
}
