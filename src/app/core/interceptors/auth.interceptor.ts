import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenRefreshService } from '../services/token-refresh.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenRefreshService = inject(TokenRefreshService);

  // If request is auth endpoint or public, do not attach token
  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
  const token = authService.getAccessToken();

  let modifiedReq = req;
  if (token && !isAuthEndpoint) {
    modifiedReq = tokenRefreshService.addToken(req, token);
  }

  return next(modifiedReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Dispatch to concurrency-safe refresh mutex handler
        return tokenRefreshService.handle401Error(modifiedReq, next);
      }
      return throwError(() => error);
    })
  );
};

