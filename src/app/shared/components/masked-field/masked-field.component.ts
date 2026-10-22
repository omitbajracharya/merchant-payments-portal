import {
  Component,
  Input,
  signal,
  computed,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AuditService } from '../../../core/services/audit.service';
import { SensitiveFieldName } from '../../../core/models/audit.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-masked-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './masked-field.component.html',
  styleUrls: ['./masked-field.component.scss'],
})
export class MaskedFieldComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly auditService = inject(AuditService);
  private readonly notificationService = inject(NotificationService);

  @Input({ required: true }) value: string = '';
  @Input() label: string = 'Field';
  @Input() fieldType: SensitiveFieldName = 'BANK_ACCOUNT_NUMBER';
  @Input() applicationId: string = '';
  @Input() applicationNumber: string = '';
  @Input() visibleChars: number = 4;
  @Input() autoRemaskSeconds: number = 30;

  readonly isRevealed = signal(false);
  readonly remainingSeconds = signal(0);

  private timerInterval?: any;

  readonly userCanReveal = computed(() => {
    return this.authService.hasRole(['REVIEWER', 'ADMIN']);
  });

  readonly maskedDisplay = computed(() => {
    if (!this.value) return '—';
    if (this.isRevealed()) return this.value;

    const clean = String(this.value).trim();
    if (clean.length <= this.visibleChars) {
      return '••••••••';
    }
    const masked = '•'.repeat(Math.max(6, clean.length - this.visibleChars));
    const visible = clean.slice(-this.visibleChars);
    return `${masked}${visible}`;
  });

  reveal(): void {
    if (!this.userCanReveal()) {
      this.notificationService.error(
        'Access Denied (RBAC Policy)',
        'SALES role is restricted from viewing raw sensitive financial identifiers. Underwriting clearance required.'
      );
      return;
    }

    this.isRevealed.set(true);
    this.remainingSeconds.set(this.autoRemaskSeconds);

    // Audit Log entry
    this.auditService.logSensitiveFieldReveal(
      this.applicationId,
      this.applicationNumber,
      this.fieldType,
      `Authorized reveal by ${this.authService.currentUser()?.name}`
    );

    this.notificationService.warning(
      'Sensitive Data Revealed',
      `Field unmasked for ${this.autoRemaskSeconds}s. Event logged to security audit trail.`
    );

    this.clearTimer();
    this.timerInterval = setInterval(() => {
      this.remainingSeconds.update((s) => {
        if (s <= 1) {
          this.hide();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  hide(): void {
    this.isRevealed.set(false);
    this.remainingSeconds.set(0);
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }
}

