import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SocketService } from './socket.service';
import { NotificationService } from './notification.service';

describe('SocketService (Socket.IO & Real-Time Status Updates)', () => {
  let service: SocketService;
  let notificationService: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [SocketService, NotificationService],
    });
    service = TestBed.inject(SocketService);
    notificationService = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    vi.useRealTimers();
  });

  it('should initialize with connected state active', () => {
    expect(service.isConnected()).toBe(true);
    expect(service.connectionType()).toBeDefined();
  });

  it('should broadcast and receive status events', () => {
    let receivedEvent: any = null;
    service.events$.subscribe((ev) => {
      receivedEvent = ev;
    });

    service.broadcastEvent({
      type: 'STATUS_CHANGE',
      applicationId: 'app_1001',
      applicationNumber: 'APP-1001',
      merchantName: 'Apex Mountain Goods',
      newStatus: 'UNDER_REVIEW',
      message: 'Underwriting review in progress',
      timestamp: new Date(),
    });

    expect(receivedEvent).toBeTruthy();
    expect(receivedEvent.applicationNumber).toBe('APP-1001');
    expect(service.lastEvent()?.newStatus).toBe('UNDER_REVIEW');
  });

  it('should allow toggling connection state', () => {
    const initialState = service.isConnected();
    service.toggleConnection();
    expect(service.isConnected()).toBe(!initialState);
  });
});

