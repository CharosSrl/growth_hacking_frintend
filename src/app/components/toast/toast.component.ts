import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe],
  animations: [
    trigger('toast', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px) scale(.97)' }),
        animate('180ms ease', style({ opacity: 1, transform: 'none' })),
      ]),
      transition(':leave', [
        animate('150ms ease', style({ opacity: 0, transform: 'translateY(-4px)' })),
      ]),
    ]),
  ],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      @for (t of toastService.toasts$ | async; track t.id) {
        <div class="toast toast--{{t.type}}" @toast role="status">
          <span class="toast__msg">{{ t.message }}</span>
          <button class="toast__close" (click)="toastService.dismiss(t.id)" aria-label="Dismiss">✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
