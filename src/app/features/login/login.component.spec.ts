import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent (Persona & Standard Authentication)', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([{ path: 'dashboard', component: LoginComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default SALES persona selected', () => {
    expect(component.selectedRole).toBe('SALES');
    expect(component.rolesList.length).toBe(3);
  });

  it('should update role when card is selected', () => {
    component.onRoleCardClick('ADMIN');
    expect(component.selectedRole).toBe('ADMIN');
    expect(component.email).toContain('elena.rostova');
  });

  it('should log in as selected role and update auth state', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.loginWithRole('ADMIN');
    vi.advanceTimersByTime(250);
    expect(authService.currentRole()).toBe('ADMIN');
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });
});

