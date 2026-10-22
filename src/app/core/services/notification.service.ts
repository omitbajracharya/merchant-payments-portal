import { Injectable, signal } from '@angular/core';

export interface ToastNotification {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly _toasts = signal<ToastNotification[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(notification: Omit<ToastNotification, 'id' | 'timestamp'>): void {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const toast: ToastNotification = {
      ...notification,
      id,
      timestamp: new Date(),
      durationMs: notification.durationMs ?? 4500,
    };

    this._toasts.update((current) => [...current, toast]);

    if (toast.durationMs && toast.durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, toast.durationMs);
    }
  }

  success(title: string, message: string): void {
    this.show({ type: 'success', title, message });
  }

  error(title: string, message: string): void {
    this.show({ type: 'danger', title, message, durationMs: 6000 });
  }

  info(title: string, message: string): void {
    this.show({ type: 'info', title, message });
  }

  warning(title: string, message: string): void {
    this.show({ type: 'warning', title, message });
  }

  dismiss(id: string): void {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }

  clearAll(): void {
    this._toasts.set([]);
  }
}

