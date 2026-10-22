import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { TokenRefreshService } from '../services/token-refresh.service';

describe('AuthInterceptor & Concurrent 401 Refresh Mutex', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let tokenRefreshService: TokenRefreshService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        AuthService,
        TokenRefreshService,
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    tokenRefreshService = TestBed.inject(TokenRefreshService);

    tokenRefreshService.reset();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Bearer token to outgoing HTTP requests', () => {
    authService.setAccessToken('test_jwt_access_token_123');

    http.get('/api/test-endpoint').subscribe((data) => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne('/api/test-endpoint');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test_jwt_access_token_123');

    req.flush({ success: true });
  });

  it('should handle several concurrent 401 responses by refreshing the token ONCE and retrying all requests', () => {
    authService.setAccessToken('expired_token_1');
    const refreshSpy = vi.spyOn(authService, 'refreshToken');

    const results: any[] = [];

    // Trigger 3 concurrent HTTP requests
    http.get('/api/resource-1').subscribe((res) => results.push({ name: 'res1', res }));
    http.get('/api/resource-2').subscribe((res) => results.push({ name: 'res2', res }));
    http.get('/api/resource-3').subscribe((res) => results.push({ name: 'res3', res }));

    // Expect the 3 initial outgoing requests
    const req1 = httpMock.expectOne('/api/resource-1');
    const req2 = httpMock.expectOne('/api/resource-2');
    const req3 = httpMock.expectOne('/api/resource-3');

    // All 3 receive a 401 Unauthorized response
    req1.flush({ message: 'Token Expired' }, { status: 401, statusText: 'Unauthorized' });
    req2.flush({ message: 'Token Expired' }, { status: 401, statusText: 'Unauthorized' });
    req3.flush({ message: 'Token Expired' }, { status: 401, statusText: 'Unauthorized' });

    // Verify that refreshToken was only called ONCE despite 3 concurrent 401s!
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    // Expect the single POST /api/auth/refresh call
    const refreshReq = httpMock.expectOne('/api/auth/refresh');
    expect(refreshReq.request.method).toBe('POST');

    // Simulate successful refresh response with new token
    const newAccessToken = 'newly_minted_refreshed_token_xyz';
    refreshReq.flush({
      accessToken: newAccessToken,
      refreshToken: 'new_refresh_token_xyz',
      expiresIn: 3600,
    });

    // Now all 3 requests should be retried with the new refreshed Bearer token!
    const retryReq1 = httpMock.expectOne('/api/resource-1');
    const retryReq2 = httpMock.expectOne('/api/resource-2');
    const retryReq3 = httpMock.expectOne('/api/resource-3');

    expect(retryReq1.request.headers.get('Authorization')).toBe(`Bearer ${newAccessToken}`);
    expect(retryReq2.request.headers.get('Authorization')).toBe(`Bearer ${newAccessToken}`);
    expect(retryReq3.request.headers.get('Authorization')).toBe(`Bearer ${newAccessToken}`);

    // Flush the retries
    retryReq1.flush({ data: 'item 1' });
    retryReq2.flush({ data: 'item 2' });
    retryReq3.flush({ data: 'item 3' });

    expect(results).toHaveLength(3);
    expect(results[0].res).toEqual({ data: 'item 1' });
    expect(results[1].res).toEqual({ data: 'item 2' });
    expect(results[2].res).toEqual({ data: 'item 3' });
  });

  it('should logout and terminate if /api/auth/refresh itself returns 401', () => {
    const logoutSpy = vi.spyOn(authService, 'logout');

    http.get('/api/sensitive-data').subscribe({
      next: () => {
        throw new Error('Should not have succeeded');
      },
      error: (err) => {
        expect(err.status).toBe(401);
      },
    });

    const initialReq = httpMock.expectOne('/api/sensitive-data');
    initialReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne('/api/auth/refresh');
    // Refresh endpoint also fails
    refreshReq.flush({ message: 'Invalid Refresh' }, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
  });
});

