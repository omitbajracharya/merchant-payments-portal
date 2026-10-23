import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { NotificationService } from './notification.service';
import { ApplicationStatus } from '../models/application.model';

export interface SocketStatusEvent {
  type: 'STATUS_CHANGE' | 'NEW_APPLICATION' | 'RISK_ALERT' | 'ASSIGNMENT_UPDATE';
  applicationId: string;
  applicationNumber: string;
  merchantName: string;
  newStatus?: ApplicationStatus;
  message: string;
  timestamp: string | Date;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private readonly notificationService = inject(NotificationService);

  private socket?: Socket;
  private readonly _events$ = new Subject<SocketStatusEvent>();
  readonly events$: Observable<SocketStatusEvent> = this._events$.asObservable();

  // Reactive state signals
  readonly isConnected = signal<boolean>(true);
  readonly connectionType = signal<'live_socket' | 'emulated'>('emulated');
  readonly lastEvent = signal<SocketStatusEvent | null>(null);

  private emulatedInterval?: any;

  constructor() {
    this.initSocketConnection();
  }

  /**
   * Initializes Socket.IO client connection.
   * Attempts connection to Socket.IO backend (ws://localhost:3000).
   * Gracefully falls back to high-fidelity in-browser emulation if no external server is running.
   */
  private initSocketConnection(): void {
    try {
      this.socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 2,
        timeout: 3000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        this.isConnected.set(true);
        this.connectionType.set('live_socket');
        this.stopEmulation();
        this.notificationService.success(
          'Socket.IO Connected',
          'Live WebSocket connection established with Underwriting Event Gateway.'
        );
      });

      this.socket.on('application:status_changed', (data: SocketStatusEvent) => {
        this.handleIncomingEvent(data);
      });

      this.socket.on('application:risk_alert', (data: SocketStatusEvent) => {
        this.handleIncomingEvent(data);
      });

      this.socket.on('disconnect', () => {
        this.isConnected.set(false);
        this.startEmulationFallback();
      });

      this.socket.on('connect_error', () => {
        // External socket server not running -> Fallback to in-browser emulator
        this.isConnected.set(true);
        this.connectionType.set('emulated');
        this.startEmulationFallback();
      });
    } catch {
      this.startEmulationFallback();
    }
  }

  /**
   * Handles incoming event from either real Socket.IO server or fallback emulator
   */
  private handleIncomingEvent(event: SocketStatusEvent): void {
    this.lastEvent.set(event);
    this._events$.next(event);
    this.notificationService.info(
      `Socket.IO Event (${event.applicationNumber})`,
      event.message
    );
  }

  /**
   * High-fidelity in-browser emulator for standalone frontend operation
   */
  private startEmulationFallback(): void {
    if (this.emulatedInterval) return;

    this.isConnected.set(true);
    this.connectionType.set('emulated');

    let tick = 0;
    this.emulatedInterval = setInterval(() => {
      if (!this.isConnected()) return;

      const sampleEvents: SocketStatusEvent[] = [
        {
          type: 'STATUS_CHANGE',
          applicationId: 'app_1002',
          applicationNumber: 'APP-1002',
          merchantName: 'Nova Artisan Coffee Roasters Inc',
          newStatus: 'UNDER_REVIEW',
          message: 'Underwriting review started for Nova Coffee Roasters',
          timestamp: new Date(),
        },
        {
          type: 'RISK_ALERT',
          applicationId: 'app_1004',
          applicationNumber: 'APP-1004',
          merchantName: 'Vanguard Digital Assets',
          newStatus: 'INFO_REQUESTED',
          message: 'FinCEN MSB registration verified by risk reviewer',
          timestamp: new Date(),
        },
        {
          type: 'STATUS_CHANGE',
          applicationId: 'app_1001',
          applicationNumber: 'APP-1001',
          merchantName: 'Apex Mountain Goods LLC',
          newStatus: 'APPROVED',
          message: 'Apex Mountain Goods approved with 2-day rolling settlement',
          timestamp: new Date(),
        },
      ];

      const event = sampleEvents[tick % sampleEvents.length];
      tick++;
      this.handleIncomingEvent(event);
    }, 30000);
  }

  private stopEmulation(): void {
    if (this.emulatedInterval) {
      clearInterval(this.emulatedInterval);
      this.emulatedInterval = undefined;
    }
  }

  /**
   * Client-to-server emit for subscribing to updates for a specific application
   */
  subscribeToApplication(applicationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe:application', { applicationId });
    }
  }

  /**
   * Broadcast an application event
   */
  broadcastEvent(event: SocketStatusEvent): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('application:update', event);
    }
    this.handleIncomingEvent(event);
  }

  toggleConnection(): void {
    this.isConnected.update((v) => !v);
  }

  ngOnDestroy(): void {
    this.stopEmulation();
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
