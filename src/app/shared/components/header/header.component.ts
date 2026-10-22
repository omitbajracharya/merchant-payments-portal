import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, MOCK_USERS } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/auth.model';
import { NotificationService } from '../../../core/services/notification.service';
import { RealTimeService } from '../../../core/services/real-time.service';
import { setSimulateTokenExpired } from '../../../core/interceptors/mock-backend.interceptor';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);
  readonly realTimeService = inject(RealTimeService);
  private readonly http = inject(HttpClient);

  readonly currentUser = this.authService.currentUser;
  readonly currentRole = this.authService.currentRole;
  readonly isConnected = this.realTimeService.isConnected;

  roles: { role: UserRole; name: string; title: string; badgeClass: string }[] = [
    {
      role: 'SALES',
      name: MOCK_USERS.SALES.name,
      title: 'Sales Representative',
      badgeClass: 'bg-primary',
    },
    {
      role: 'REVIEWER',
      name: MOCK_USERS.REVIEWER.name,
      title: 'Senior Risk Reviewer',
      badgeClass: 'bg-warning text-dark',
    },
    {
      role: 'ADMIN',
      name: MOCK_USERS.ADMIN.name,
      title: 'Compliance & Risk Admin',
      badgeClass: 'bg-danger',
    },
  ];

  switchUser(role: UserRole): void {
    this.authService.switchRole(role);
    const user = this.authService.currentUser();
    this.notificationService.success(
      'Role Switched',
      `Active persona changed to ${user?.name} (${user?.role})`
    );
  }

  /**
   * Demonstrates the core HTTP Interceptor requirement:
   * Triggers 3 concurrent API requests with an expired token to prove that /api/auth/refresh
   * is called exactly once, mutexing the requests, and retrying them seamlessly!
   */
  simulateConcurrent401Burst(): void {
    setSimulateTokenExpired(true);
    this.notificationService.warning(
      'Simulating Expired Token',
      'Triggering 3 concurrent requests. Watch network console: only 1 /auth/refresh call fires!'
    );

    forkJoin({
      metrics: this.http.get('/api/applications/metrics'),
      apps: this.http.get('/api/applications?page=1&pageSize=3'),
      detail: this.http.get('/api/applications/app_1001'),
    }).subscribe({
      next: (results) => {
        this.notificationService.success(
          'Token Refreshed Successfully',
          'Mutex lock synchronized all 3 concurrent requests after single POST /api/auth/refresh!'
        );
      },
      error: (err) => {
        this.notificationService.error(
          'Simulation Error',
          'Refresh flow error: ' + (err.message || 'Unauthorized')
        );
      },
    });
  }
}

