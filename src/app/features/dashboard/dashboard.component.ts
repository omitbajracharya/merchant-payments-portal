import { Component, OnInit, OnDestroy, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  tap,
} from 'rxjs/operators';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService, MOCK_USERS } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { RealTimeService } from '../../core/services/real-time.service';
import {
  MerchantApplication,
  ApplicationFilter,
  ApplicationMetrics,
  ApplicationStatus,
  RiskTier,
} from '../../core/models/application.model';
import { UserRole } from '../../core/models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly appService = inject(ApplicationService);
  readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly realTimeService = inject(RealTimeService);
  private readonly router = inject(Router);

  // Reactive State Signals
  readonly applications = signal<MerchantApplication[]>([]);
  readonly metrics = signal<ApplicationMetrics | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly totalItems = signal<number>(0);
  readonly totalPages = signal<number>(1);
  protected readonly Math = Math;

  // Role Scope Filter:
  // 'ROLE_DEFAULT': Sales -> My Apps; Reviewer -> Assigned to Me; Admin -> All
  // 'ALL': All applications across the portal
  // 'UNASSIGNED': Applications waiting for reviewer assignment (Crucial for Admin!)
  readonly roleScope = signal<'ROLE_DEFAULT' | 'ALL' | 'UNASSIGNED'>('ROLE_DEFAULT');

  // Filter State
  searchQuery = '';
  selectedStatus: ApplicationStatus | 'ALL' = 'ALL';
  selectedRiskTier: RiskTier | 'ALL' = 'ALL';
  currentPage = 1;
  pageSize = 5;
  sortBy: ApplicationFilter['sortBy'] = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Toggle for simulating network error to demonstrate recovery state
  simulateNetworkError = false;

  private readonly filterChange$ = new Subject<void>();
  private readonly searchChange$ = new Subject<string>();
  private sub = new Subscription();

  constructor() {
    // Whenever the active persona role changes in AuthService, reset to ROLE_DEFAULT and trigger reload
    effect(() => {
      this.authService.currentRole();
      this.roleScope.set('ROLE_DEFAULT');
      this.currentPage = 1;
      this.triggerReload();
    });
  }

  ngOnInit(): void {
    this.setupFilterStreams();
    this.setupRealTimeListener();
    this.loadMetrics();
    this.triggerReload();
  }

  private setupFilterStreams(): void {
    // Debounce search input
    this.sub.add(
      this.searchChange$
        .pipe(
          debounceTime(350),
          distinctUntilChanged(),
          tap((term) => {
            this.searchQuery = term;
            this.currentPage = 1;
            this.filterChange$.next();
          })
        )
        .subscribe()
    );

    // Primary data fetch pipeline
    this.sub.add(
      this.filterChange$
        .pipe(
          tap(() => {
            this.isLoading.set(true);
            this.hasError.set(false);
          }),
          switchMap(() => {
            if (this.simulateNetworkError) {
              return of(null).pipe(
                switchMap(() => {
                  throw new Error(
                    'Simulated network failure. Could not connect to Underwriting Service.'
                  );
                })
              );
            }

            const currentRole = this.authService.currentRole();
            const scope = this.roleScope();

            let assignedTo: string = 'ALL';
            let salesRepId: string = 'ALL';

            if (scope === 'UNASSIGNED') {
              assignedTo = 'UNASSIGNED';
            } else if (scope === 'ROLE_DEFAULT') {
              if (currentRole === 'SALES') {
                salesRepId = 'usr_sales_01'; // Sarah Jenkins
              } else if (currentRole === 'REVIEWER') {
                assignedTo = 'usr_reviewer_02'; // Marcus Vance
              }
            }

            const filter: ApplicationFilter = {
              searchQuery: this.searchQuery,
              status: this.selectedStatus,
              riskTier: this.selectedRiskTier,
              assignedTo,
              salesRepId,
              page: this.currentPage,
              pageSize: this.pageSize,
              sortBy: this.sortBy,
              sortDirection: this.sortDirection,
            };

            return this.appService.getApplications(filter).pipe(
              catchError((err) => {
                this.hasError.set(true);
                this.errorMessage.set(
                  err.message || 'Failed to retrieve applications from server. Please retry.'
                );
                return of(null);
              })
            );
          }),
          tap((res) => {
            this.isLoading.set(false);
            if (res) {
              this.applications.set(res.items);
              this.totalItems.set(res.totalItems);
              this.totalPages.set(res.totalPages);
            }
          })
        )
        .subscribe()
    );
  }

  private setupRealTimeListener(): void {
    this.sub.add(
      this.realTimeService.events$.subscribe(() => {
        this.triggerReload();
        this.loadMetrics();
      })
    );
  }

  loadMetrics(): void {
    this.appService.getMetrics().subscribe({
      next: (data) => this.metrics.set(data),
      error: () => {},
    });
  }

  onSearchInput(value: string): void {
    this.searchChange$.next(value);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.triggerReload();
  }

  setRoleScope(scope: 'ROLE_DEFAULT' | 'ALL' | 'UNASSIGNED'): void {
    this.roleScope.set(scope);
    this.currentPage = 1;
    this.triggerReload();
  }

  switchPersona(role: UserRole): void {
    this.authService.switchRole(role);
    const user = this.authService.currentUser();
    this.notificationService.success(
      'Persona Switched',
      `Active persona changed to ${user?.name} (${user?.role})`
    );
  }

  setSort(column: ApplicationFilter['sortBy']): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'desc';
    }
    this.triggerReload();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage) {
      this.currentPage = page;
      this.triggerReload();
    }
  }

  setPageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.triggerReload();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = 'ALL';
    this.selectedRiskTier = 'ALL';
    this.roleScope.set('ROLE_DEFAULT');
    this.currentPage = 1;
    this.sortBy = 'createdAt';
    this.sortDirection = 'desc';
    this.triggerReload();
  }

  toggleSimulateError(): void {
    this.simulateNetworkError = !this.simulateNetworkError;
    if (this.simulateNetworkError) {
      this.notificationService.warning(
        'Simulated Error Enabled',
        'Next request will fail to demonstrate error and retry handling.'
      );
    } else {
      this.notificationService.info('Simulated Error Disabled', 'Normal connectivity restored.');
    }
    this.triggerReload();
  }

  triggerReload(): void {
    this.filterChange$.next();
  }

  /**
   * Admin quick assignment: Assigns unassigned application to a reviewer directly from the table!
   */
  assignReviewerInline(app: MerchantApplication, reviewerId: string, reviewerName: string): void {
    const admin = this.authService.currentUser();
    this.appService
      .reassignApplication(app.id, {
        reviewerId,
        reviewerName,
        adminName: admin?.name || 'Elena Rostova',
      })
      .subscribe({
        next: (updated) => {
          this.notificationService.success(
            'Reviewer Assigned!',
            `Application ${updated.applicationNumber} assigned to ${reviewerName}. Status moved to UNDER_REVIEW.`
          );
          this.triggerReload();
          this.loadMetrics();
        },
        error: () => {
          this.notificationService.error('Assignment Error', 'Failed to assign reviewer.');
        },
      });
  }

  // Permission Checks for Actions
  canEdit(app: MerchantApplication): boolean {
    const role = this.authService.currentRole();
    if (role === 'ADMIN') return true;
    if (role === 'SALES') {
      return (
        app.status === 'DRAFT' ||
        app.status === 'SUBMITTED' ||
        app.status === 'INFO_REQUESTED'
      );
    }
    return false;
  }

  canReview(app: MerchantApplication): boolean {
    const role = this.authService.currentRole();
    return role === 'REVIEWER' || role === 'ADMIN';
  }

  canAdminAssign(): boolean {
    return this.authService.currentRole() === 'ADMIN';
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
