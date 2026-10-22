import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.currentRole();

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // Unauthorized access: redirect to dashboard
    return router.createUrlTree(['/dashboard'], {
      queryParams: { error: 'unauthorized_access' },
    });
  };
};

