import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService, MOCK_USERS } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { MaskedFieldComponent } from '../../shared/components/masked-field/masked-field.component';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import {
  MerchantApplication,
  RiskTier,
  ApplicationStatus,
} from '../../core/models/application.model';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MaskedFieldComponent, HasRoleDirective],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.scss'],
})
export class ApplicationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appService = inject(ApplicationService);
  readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly application = signal<MerchantApplication | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly activeTab = signal<'profile' | 'owners' | 'banking' | 'processing' | 'history'>('profile');
  readonly isDecisionSubmitting = signal<boolean>(false);

  // Reviewer Decision Form State
  decisionType: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'FLAG_RISK' = 'APPROVE';
  decisionRiskTier: RiskTier = 'LOW';
  decisionNotes: string = '';
  decisionConditions: string = '';

  // Admin Reassign Modal State
  selectedReviewerId: string = 'usr_reviewer_02';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadApplication(id);
    }

    // Check if queryParam ?action=review is present
    const action = this.route.snapshot.queryParamMap.get('action');
    if (action === 'review') {
      this.activeTab.set('processing');
    }
  }

  loadApplication(id: string): void {
    this.isLoading.set(true);
    this.appService.getApplicationById(id).subscribe({
      next: (app) => {
        this.application.set(app);
        this.decisionRiskTier = app.riskTier;
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.error('Error', `Application ${id} not found.`);
        this.router.navigate(['/dashboard']);
      },
    });
  }

  submitDecision(): void {
    const app = this.application();
    const currentUser = this.authService.currentUser();
    if (!app || !currentUser) return;

    if (!this.decisionNotes.trim() && (this.decisionType === 'REJECT' || this.decisionType === 'REQUEST_INFO')) {
      this.notificationService.warning(
        'Required Explanation',
        'Reviewer justification notes are mandatory when declining or requesting additional information.'
      );
      return;
    }

    this.isDecisionSubmitting.set(true);
    this.appService
      .recordDecision(app.id, {
        decision: this.decisionType,
        riskTier: this.decisionRiskTier,
        notes: this.decisionNotes,
        conditions: this.decisionConditions,
        reviewerId: currentUser.id,
        reviewerName: currentUser.name,
      })
      .subscribe({
        next: (updated) => {
          this.application.set(updated);
          this.isDecisionSubmitting.set(false);
          this.decisionNotes = '';
          this.decisionConditions = '';
          this.notificationService.success(
            'Risk Decision Recorded',
            `Application status successfully updated to ${updated.status}.`
          );
        },
        error: (err) => {
          this.isDecisionSubmitting.set(false);
          this.notificationService.error(
            'Decision Failed',
            err.message || 'Failed to submit decision to server.'
          );
        },
      });
  }

  reassignReviewer(): void {
    const app = this.application();
    const currentUser = this.authService.currentUser();
    if (!app || !currentUser) return;

    const reviewerName =
      this.selectedReviewerId === 'usr_reviewer_02'
        ? MOCK_USERS.REVIEWER.name
        : 'Senior Underwriter Pool';

    this.appService
      .reassignApplication(app.id, {
        reviewerId: this.selectedReviewerId,
        reviewerName,
        adminName: currentUser.name,
      })
      .subscribe({
        next: (updated) => {
          this.application.set(updated);
          this.notificationService.success(
            'Assignment Updated',
            `Application successfully assigned to ${reviewerName}.`
          );
        },
        error: () => {
          this.notificationService.error('Reassignment Error', 'Failed to update reviewer assignment.');
        },
      });
  }
}

