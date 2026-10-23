import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { SocketService, SocketStatusEvent } from './socket.service';
import { ApplicationStatus } from '../models/application.model';

export type RealTimeEvent = SocketStatusEvent;

@Injectable({
  providedIn: 'root',
})
export class RealTimeService {
  private readonly socketService = inject(SocketService);

  readonly events$: Observable<RealTimeEvent> = this.socketService.events$;
  readonly isConnected = this.socketService.isConnected;
  readonly connectionType = this.socketService.connectionType;
  readonly lastEvent = this.socketService.lastEvent;

  /**
   * Broadcasts or pushes a real-time underwriting status update event
   */
  emit(event: RealTimeEvent): void {
    this.socketService.broadcastEvent(event);
  }

  toggleConnection(): void {
    this.socketService.toggleConnection();
  }

  subscribeToApplication(applicationId: string): void {
    this.socketService.subscribeToApplication(applicationId);
  }
}
