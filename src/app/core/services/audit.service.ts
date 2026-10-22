import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuditLogEntry, SensitiveFieldName } from '../models/audit.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly _logs = signal<AuditLogEntry[]>([
    {
      id: 'audit_init_1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userId: 'usr_reviewer_02',
      userName: 'Marcus Vance',
      userRole: 'REVIEWER',
      action: 'REVEAL_SENSITIVE_DATA',
      targetApplicationId: 'app_1001',
      targetApplicationNumber: 'APP-1001',
      sensitiveField: 'BANK_ACCOUNT_NUMBER',
      reason: 'Underwriting bank routing & account verification for high-volume merchant',
    },
  ]);

  readonly logs = this._logs.asReadonly();

  logSensitiveFieldReveal(
    applicationId: string,
    applicationNumber: string,
    fieldName: SensitiveFieldName,
    reason: string = 'Authorized underwriting review'
  ): void {
    const user = this.authService.currentUser();
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'anonymous',
      userName: user?.name || 'Unknown User',
      userRole: user?.role || 'SALES',
      action: 'REVEAL_SENSITIVE_DATA',
      targetApplicationId: applicationId,
      targetApplicationNumber: applicationNumber,
      sensitiveField: fieldName,
      reason,
    };

    // Prepend locally in signal
    this._logs.update((curr) => [entry, ...curr]);

    // Send to audit endpoint
    this.http.post('/api/audit/sensitive-reveal', entry).subscribe({
      error: (err) => console.warn('Failed to log audit event to server:', err),
    });
  }
}

