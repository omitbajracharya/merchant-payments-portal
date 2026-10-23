import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, MOCK_USERS } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/auth.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  readonly rolesList: { role: UserRole; name: string; title: string; email: string; badgeClass: string; icon: string }[] = [
    {
      role: 'SALES',
      name: MOCK_USERS.SALES.name,
      title: 'Sales Representative',
      email: MOCK_USERS.SALES.email,
      badgeClass: 'bg-primary',
      icon: 'bi-briefcase-fill',
    },
    {
      role: 'ADMIN',
      name: MOCK_USERS.ADMIN.name,
      title: 'Compliance & Risk Admin',
      email: MOCK_USERS.ADMIN.email,
      badgeClass: 'bg-danger',
      icon: 'bi-shield-shaded',
    },
    {
      role: 'REVIEWER',
      name: MOCK_USERS.REVIEWER.name,
      title: 'Senior Risk Reviewer',
      email: MOCK_USERS.REVIEWER.email,
      badgeClass: 'bg-warning text-dark',
      icon: 'bi-search',
    },
  ];

  selectedRole: UserRole = 'SALES';
  email = MOCK_USERS.SALES.email;
  password = '••••••••••••';
  isSubmitting = signal(false);

  onRoleCardClick(role: UserRole): void {
    this.selectedRole = role;
    this.email = MOCK_USERS[role].email;
  }

  loginWithRole(role: UserRole): void {
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.authService.loginAs(role);
      this.isSubmitting.set(false);
      this.notificationService.success(
        'Authentication Successful',
        `Logged in as ${MOCK_USERS[role].name} (${role})`
      );
      this.router.navigate(['/dashboard']);
    }, 200);
  }

  onSubmit(): void {
    this.loginWithRole(this.selectedRole);
  }
}

