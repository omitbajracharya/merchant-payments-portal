import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TokenRefreshService {
  private readonly authService = inject(AuthService);

  private isRefreshing = false;
  private readonly refreshTokenSubject = new BehaviorSubject<string | null>(null);

  /**
   * Returns whether a refresh cycle is currently underway
   */
  get isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }

  /**
   * Handles 401 error with concurrency mutex queue
   */
  handle401Error(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
  ): Observable<HttpEvent<unknown>> {
    // If 401 occurred on the refresh endpoint itself or login endpoint, terminate immediately
    if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
      this.isRefreshing = false;
      this.authService.logout();
      return throwError(
        () => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })
      );
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null); // Lock waiting requests

      return this.authService.refreshToken().pipe(
        switchMap((res) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(res.accessToken);
          // Retry the original request with the fresh token
          return next(this.addToken(req, res.accessToken));
        }),
        catchError((refreshErr) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          this.authService.logout();
          return throwError(() => refreshErr);
        })
      );
    } else {
      // Concurrent request while refresh is in flight:
      // Wait for refreshTokenSubject to emit the new non-null token, take 1, and retry
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap((token) => next(this.addToken(req, token)))
      );
    }
  }

  /**
   * Helper to clone request with Authorization header
   */
  addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Reset state (useful for tests or logout)
   */
  reset(): void {
    this.isRefreshing = false;
    this.refreshTokenSubject.next(null);
  }
}

