import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationService } from '../../core/services/application.service';

describe('DashboardComponent (Data Table & Permission Actions)', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authService: AuthService;
  let appService: ApplicationService;

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
    appService = TestBed.inject(ApplicationService);
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
    expect(component.canAdminAssign()).toBe(false);

    authService.switchRole('REVIEWER');
    expect(component.canEdit(mockApp)).toBe(false);
    expect(component.canReview(mockApp)).toBe(true);
    expect(component.canAdminAssign()).toBe(false);

    authService.switchRole('ADMIN');
    expect(component.canEdit(mockApp)).toBe(true);
    expect(component.canReview(mockApp)).toBe(true);
    expect(component.canAdminAssign()).toBe(true);
  });

  it('should update sort direction when column is clicked', () => {
    component.setSort('legalName');
    expect(component.sortBy).toBe('legalName');
    expect(component.sortDirection).toBe('desc');

    component.setSort('legalName');
    expect(component.sortDirection).toBe('asc');
  });

  it('should allow switching persona directly and resetting role scope', () => {
    component.switchPersona('SALES');
    expect(authService.currentRole()).toBe('SALES');

    component.setRoleScope('UNASSIGNED');
    expect(component.roleScope()).toBe('UNASSIGNED');
  });

  it('should allow admin to assign reviewer inline', () => {
    authService.switchRole('ADMIN');
    const mockApp: any = { id: 'app_1002', applicationNumber: 'APP-1002' };
    const reassignSpy = vi.spyOn(appService, 'reassignApplication').mockReturnValue(
      of({ ...mockApp, status: 'UNDER_REVIEW', assignedReviewerName: 'Marcus Vance' })
    );

    component.assignReviewerInline(mockApp, 'usr_reviewer_02', 'Marcus Vance');
    expect(reassignSpy).toHaveBeenCalledWith(
      'app_1002',
      expect.objectContaining({
        reviewerId: 'usr_reviewer_02',
        reviewerName: 'Marcus Vance',
      })
    );
  });
});
