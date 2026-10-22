import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationService } from '../../core/services/application.service';

describe('DashboardComponent (Data Table & Permission Actions)', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        ApplicationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
  });

  it('should initialize and load applications', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(5);
  });

  it('should evaluate permissions correctly based on current persona', () => {
    const mockApp: any = {
      id: 'app_1',
      status: 'SUBMITTED',
      salesRepId: 'usr_sales_01',
    };

    authService.switchRole('SALES');
    expect(component.canEdit(mockApp)).toBe(true);
    expect(component.canReview(mockApp)).toBe(false);

    authService.switchRole('REVIEWER');
    expect(component.canEdit(mockApp)).toBe(false);
    expect(component.canReview(mockApp)).toBe(true);

    authService.switchRole('ADMIN');
    expect(component.canEdit(mockApp)).toBe(true);
    expect(component.canReview(mockApp)).toBe(true);
  });

  it('should update sort direction when column is clicked', () => {
    component.setSort('legalName');
    expect(component.sortBy).toBe('legalName');
    expect(component.sortDirection).toBe('desc');

    component.setSort('legalName');
    expect(component.sortDirection).toBe('asc');
  });
});

