import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts.asObservable();
  private nextId = 0;

  show(message: string, type: Toast['type'] = 'info', duration = 3500) {
    const id = ++this.nextId;
    this._toasts.next([...this._toasts.value, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number) {
    this._toasts.next(this._toasts.value.filter(t => t.id !== id));
  }

  success(msg: string, d?: number) { this.show(msg, 'success', d); }
  error(msg: string, d?: number)   { this.show(msg, 'error', d); }
  info(msg: string, d?: number)    { this.show(msg, 'info', d); }
}
