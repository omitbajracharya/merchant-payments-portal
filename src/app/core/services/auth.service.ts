import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  User,
  UserRole,
  Permission,
  AuthTokens,
  RefreshTokenResponse,
} from '../models/auth.model';

export const MOCK_USERS: Record<UserRole, User> = {
  SALES: {
    id: 'usr_sales_01',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@paygate-portal.io',
    role: 'SALES',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    permissions: [
      'CREATE_APPLICATION',
      'EDIT_OWN_APPLICATION',
      'VIEW_ASSIGNED_APPLICATIONS',
    ],
  },
  REVIEWER: {
    id: 'usr_reviewer_02',
    name: 'Marcus Vance',
    email: 'marcus.vance@paygate-portal.io',
    role: 'REVIEWER',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    permissions: [
      'VIEW_ASSIGNED_APPLICATIONS',
      'REVIEW_DECISION',
      'REVEAL_SENSITIVE_DATA',
    ],
  },
  ADMIN: {
    id: 'usr_admin_03',
    name: 'Elena Rostova',
    email: 'elena.rostova@paygate-portal.io',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    permissions: [
      'CREATE_APPLICATION',
      'EDIT_OWN_APPLICATION',
      'VIEW_ALL_APPLICATIONS',
      'VIEW_ASSIGNED_APPLICATIONS',
      'REVIEW_DECISION',
      'REASSIGN_APPLICATION',
      'REVEAL_SENSITIVE_DATA',
      'ACCESS_AUDIT_LOGS',
    ],
  },
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Reactive State via Signals
  private readonly _currentUser = signal<User | null>(MOCK_USERS.REVIEWER); // Default to REVIEWER for reviewing assignment
  private readonly _tokens = signal<AuthTokens | null>({
    accessToken: 'mock_jwt_access_token_v1',
    refreshToken: 'mock_jwt_refresh_token_v1',
    expiresIn: 3600,
    tokenType: 'Bearer',
  });

  // Public Signal Readonly views
  readonly currentUser = this._currentUser.asReadonly();
  readonly currentRole = computed(() => this._currentUser()?.role ?? null);
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly permissions = computed(() => this._currentUser()?.permissions ?? []);

  constructor() {
    // Attempt restoring from sessionStorage if present
    const savedRole = sessionStorage.getItem('paygate_active_role') as UserRole | null;
    if (savedRole && MOCK_USERS[savedRole]) {
      this._currentUser.set(MOCK_USERS[savedRole]);
    }
  }

  getAccessToken(): string | null {
    return this._tokens()?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this._tokens()?.refreshToken ?? null;
  }

  hasRole(roles: UserRole | UserRole[]): boolean {
    const user = this._currentUser();
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  }

  hasPermission(permission: Permission): boolean {
    const user = this._currentUser();
    if (!user) return false;
    return user.permissions.includes(permission);
  }

  /**
   * Fast persona switcher for evaluation & testing RBAC behaviors
   */
  switchRole(role: UserRole): void {
    const targetUser = MOCK_USERS[role];
    if (targetUser) {
      this._currentUser.set(targetUser);
      sessionStorage.setItem('paygate_active_role', role);
      // Give each role a fresh token
      this._tokens.set({
        accessToken: `mock_jwt_access_token_${role.toLowerCase()}_${Date.now()}`,
        refreshToken: `mock_jwt_refresh_token_${role.toLowerCase()}`,
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
    }
  }

  /**
   * Refreshes the access token via POST /api/auth/refresh
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const currentRefresh = this.getRefreshToken() || 'mock_jwt_refresh_token_fallback';
    return this.http
      .post<RefreshTokenResponse>('/api/auth/refresh', {
        refreshToken: currentRefresh,
      })
      .pipe(
        tap((res) => {
          this._tokens.update((curr) => {
            if (!curr) return null;
            return {
              ...curr,
              accessToken: res.accessToken,
              refreshToken: res.refreshToken,
              expiresIn: res.expiresIn,
            };
          });
        }),
        catchError((err) => {
          // Token refresh permanently failed -> logout
          this.logout();
          return throwError(() => err);
        })
      );
  }

  setAccessToken(token: string): void {
    this._tokens.update((curr) => {
      if (!curr) return null;
      return { ...curr, accessToken: token };
    });
  }

  logout(): void {
    this._currentUser.set(null);
    this._tokens.set(null);
    sessionStorage.removeItem('paygate_active_role');
  }

  loginAs(role: UserRole): void {
    this.switchRole(role);
  }
}

