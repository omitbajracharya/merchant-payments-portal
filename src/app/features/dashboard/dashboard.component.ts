import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, combineLatest, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  tap,
} from 'rxjs/operators';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { RealTimeService } from '../../core/services/real-time.service';
import {
  MerchantApplication,
  ApplicationFilter,
  ApplicationMetrics,
  ApplicationStatus,
  RiskTier,
} from '../../core/models/application.model';

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
            this.currentPage = 1; // Reset to page 1 on new search
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
                  throw new Error('Simulated network failure. Could not connect to Underwriting Service.');
                })
              );
            }

            const filter: ApplicationFilter = {
              searchQuery: this.searchQuery,
              status: this.selectedStatus,
              riskTier: this.selectedRiskTier,
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
      this.realTimeService.events$.subscribe((event) => {
        // Reload list and metrics on real-time update
        this.triggerReload();
        this.loadMetrics();
      })
    );
  }

  loadMetrics(): void {
    this.appService.getMetrics().subscribe({
      next: (data) => this.metrics.set(data),
      error: () => {}, // Handled quietly
    });
  }

  onSearchInput(value: string): void {
    this.searchChange$.next(value);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.triggerReload();
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

  // Permission Checks for Actions
  canEdit(app: MerchantApplication): boolean {
    const role = this.authService.currentRole();
    if (role === 'ADMIN') return true;
    if (role === 'SALES') {
      return app.status === 'DRAFT' || app.status === 'SUBMITTED' || app.status === 'INFO_REQUESTED';
    }
    return false;
  }

  canReview(app: MerchantApplication): boolean {
    const role = this.authService.currentRole();
    return role === 'REVIEWER' || role === 'ADMIN';
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
