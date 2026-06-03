import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StateService } from '../../services/state.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="app-header">
      <div class="app-header__left">
        <a routerLink="/projects" class="app-logo" aria-label="GrowthOS">
          <div class="app-logo__mark">
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <path d="M4 18L11 4l7 14" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
              <path d="M7 13h8" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="app-logo__text">GrowthOS</span>
        </a>
        <ng-content select="[breadcrumb]" />
      </div>
      <div class="app-header__right">
        <button class="icon-btn" (click)="state.toggleTheme()" title="Toggle theme" aria-label="Toggle theme">
          @if (state.themeSnapshot === 'dark') {
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="8" cy="8" r="3"/>
              <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M11.89 4.11l1.06-1.06M3.05 12.95l1.06-1.06"/>
            </svg>
          } @else {
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M13.5 10.5A6 6 0 015.5 2.5a6 6 0 108 8z"/>
            </svg>
          }
        </button>
        @if (state.userSnapshot) {
          <div class="user-menu">
            @if (state.userSnapshot.photoURL) {
              <img [src]="state.userSnapshot.photoURL" class="user-avatar"
                   [alt]="state.userSnapshot.displayName || 'User'" referrerpolicy="no-referrer">
            } @else {
              <div class="user-avatar user-avatar--initials">
                {{ (state.userSnapshot.displayName || state.userSnapshot.email || 'U')[0].toUpperCase() }}
              </div>
            }
            <button class="btn btn--ghost btn--sm" (click)="auth.signOut()">Sign out</button>
          </div>
        }
        <button class="icon-btn icon-btn--adv" (click)="reconfigure()" title="Reconfigure Firebase" aria-label="Reconfigure">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="8" cy="8" r="2.5"/>
            <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M11.89 4.11l1.06-1.06M3.05 12.95l1.06-1.06"/>
          </svg>
        </button>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  constructor(public state: StateService, public auth: AuthService) {}

  reconfigure() {
    localStorage.removeItem('growthos_config');
    location.reload();
  }
}
