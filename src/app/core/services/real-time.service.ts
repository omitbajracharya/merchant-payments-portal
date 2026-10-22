import { Injectable, inject, signal } from '@angular/core';
import { Subject, Observable, interval, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { ApplicationStatus } from '../models/application.model';

export interface RealTimeEvent {
  type: 'STATUS_CHANGE' | 'NEW_APPLICATION' | 'RISK_ALERT' | 'ASSIGNMENT_UPDATE';
  applicationId: string;
  applicationNumber: string;
  merchantName: string;
  newStatus?: ApplicationStatus;
  message: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class RealTimeService {
  private readonly notificationService = inject(NotificationService);

  private readonly _event$ = new Subject<RealTimeEvent>();
  readonly events$: Observable<RealTimeEvent> = this._event$.asObservable();

  readonly isConnected = signal(true);
  private simulationSub?: Subscription;

  constructor() {
    this.startSimulation();
  }

  /**
   * Simulates incoming WebSocket messages at periodic intervals
   */
  private startSimulation(): void {
    // Generate realistic periodic live merchant events every 35 seconds
    this.simulationSub = interval(35000).pipe(
      map((tick) => {
        const events: RealTimeEvent[] = [
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
            message: 'Additional AML compliance documentation uploaded',
            timestamp: new Date(),
          },
        ];
        return events[tick % events.length];
      })
    ).subscribe((event) => {
      if (this.isConnected()) {
        this.emit(event);
      }
    });
  }

  emit(event: RealTimeEvent): void {
    this._event$.next(event);
    this.notificationService.info(
      `Real-Time Event: ${event.applicationNumber}`,
      event.message
    );
  }

  toggleConnection(): void {
    this.isConnected.update((val) => !val);
  }

  disconnect(): void {
    this.isConnected.set(false);
    if (this.simulationSub) {
      this.simulationSub.unsubscribe();
    }
  }
}

