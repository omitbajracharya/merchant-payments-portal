import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { AuthService, MOCK_USERS } from '../services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Auth & Role Guards', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      authService.switchRole('REVIEWER');
      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );
      expect(result).toBe(true);
    });

    it('should redirect to /dashboard when user is not authenticated', () => {
      authService.logout();
      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/dashboard');
    });
  });

  describe('roleGuard', () => {
    it('should allow access when user role matches allowed roles', () => {
      authService.switchRole('ADMIN');
      const guard = roleGuard(['ADMIN', 'REVIEWER']);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any)
      );
      expect(result).toBe(true);
    });

    it('should deny access and redirect to dashboard when user role does not match', () => {
      authService.switchRole('SALES');
      const guard = roleGuard(['ADMIN']);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any)
      );
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toContain('/dashboard');
      expect((result as UrlTree).queryParams['error']).toBe('unauthorized_access');
    });
  });
});

