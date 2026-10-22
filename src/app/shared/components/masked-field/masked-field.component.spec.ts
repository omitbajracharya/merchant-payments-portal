import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaskedFieldComponent } from './masked-field.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuditService } from '../../../core/services/audit.service';
import { NotificationService } from '../../../core/services/notification.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MaskedFieldComponent (Sensitive Data & Controlled Reveal)', () => {
  let component: MaskedFieldComponent;
  let fixture: ComponentFixture<MaskedFieldComponent>;
  let authService: AuthService;
  let auditService: AuditService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaskedFieldComponent],
      providers: [
        AuthService,
        AuditService,
        NotificationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MaskedFieldComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    auditService = TestBed.inject(AuditService);

    component.value = '1234567890';
    component.label = 'Bank Account';
    component.fieldType = 'BANK_ACCOUNT_NUMBER';
    component.applicationId = 'app_1001';
    component.applicationNumber = 'APP-1001';
  });

  it('should mask the sensitive value by default', () => {
    fixture.detectChanges();
    expect(component.isRevealed()).toBe(false);
    expect(component.maskedDisplay()).toContain('7890');
    expect(component.maskedDisplay()).toContain('•');
  });

  it('should allow REVIEWER to reveal sensitive value and log audit trail', () => {
    authService.switchRole('REVIEWER');
    const auditSpy = vi.spyOn(auditService, 'logSensitiveFieldReveal');

    fixture.detectChanges();
    component.reveal();

    expect(component.isRevealed()).toBe(true);
    expect(component.maskedDisplay()).toBe('1234567890');
    expect(auditSpy).toHaveBeenCalledWith(
      'app_1001',
      'APP-1001',
      'BANK_ACCOUNT_NUMBER',
      expect.anything()
    );
  });

  it('should prevent SALES role from revealing sensitive financial details', () => {
    authService.switchRole('SALES');
    fixture.detectChanges();

    component.reveal();

    expect(component.isRevealed()).toBe(false);
    expect(component.maskedDisplay()).not.toBe('1234567890');
  });

  it('should hide value and reset timer on hide()', () => {
    authService.switchRole('ADMIN');
    fixture.detectChanges();

    component.reveal();
    expect(component.isRevealed()).toBe(true);

    component.hide();
    expect(component.isRevealed()).toBe(false);
    expect(component.remainingSeconds()).toBe(0);
  });
});

