import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApplicationService } from '../../core/services/application.service';
import { AutoSaveService } from '../../core/services/auto-save.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { einValidator } from '../../shared/validators/ein.validator';
import { routingNumberValidator } from '../../shared/validators/routing-number.validator';
import {
  totalOwnershipValidator,
  kycThresholdValidator,
} from '../../shared/validators/ownership.validator';
import {
  ticketSizeValidator,
  matchAccountsValidator,
} from '../../shared/validators/ticket-size.validator';
import { MerchantApplication } from '../../core/models/application.model';

@Component({
  selector: 'app-application-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './application-wizard.component.html',
  styleUrls: ['./application-wizard.component.scss'],
})
export class ApplicationWizardComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly appService = inject(ApplicationService);
  readonly autoSaveService = inject(AutoSaveService);
  readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Stepper State
  readonly currentStep = signal<number>(1);
  readonly totalSteps = 5;
  readonly isSubmitting = signal<boolean>(false);
  readonly draftBannerVisible = signal<boolean>(false);
  readonly editingAppId = signal<string | null>(null);

  // Auto-Save Status Signals from AutoSaveService
  readonly autoSaveStatus = this.autoSaveService.status;
  readonly lastSavedTime = this.autoSaveService.lastSavedTime;
  readonly autoSaveError = this.autoSaveService.errorMessage;

  wizardForm!: FormGroup;
  private sub = new Subscription();

  stepTitles = [
    { number: 1, title: 'Business Profile', subtitle: 'Legal entity & registration' },
    { number: 2, title: 'Beneficial Owners', subtitle: 'Key controllers & FinCEN KYC' },
    { number: 3, title: 'Banking & Settlement', subtitle: 'Account routing & depository' },
    { number: 4, title: 'Processing Profile', subtitle: 'Volume & risk assessment' },
    { number: 5, title: 'Review & Submit', subtitle: 'Attestation & submission' },
  ];

  ngOnInit(): void {
    this.buildForm();

    // Check if editing existing application or resuming draft
    const appId = this.route.snapshot.paramMap.get('id');
    if (appId) {
      this.editingAppId.set(appId);
      this.loadExistingApplication(appId);
    } else {
      // Check for saved local draft
      const savedLocal = localStorage.getItem('paygate_wizard_draft');
      if (savedLocal) {
        this.draftBannerVisible.set(true);
      }
      this.initAutoSave('draft_new');
    }
  }

  private buildForm(): void {
    this.wizardForm = this.fb.group({
      // Step 1: Business Details
      businessDetails: this.fb.group({
        legalName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
        dbaName: [''],
        taxId: ['', [Validators.required, einValidator()]],
        businessType: ['LLC', [Validators.required]],
        incorporationDate: ['', [Validators.required]],
        websiteUrl: [
          '',
          [
            Validators.required,
            Validators.pattern(/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,10}(\/.*)?$/),
          ],
        ],
        phone: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/),
          ],
        ],
        industryCategory: ['Retail - E-Commerce', [Validators.required]],
        address: this.fb.group({
          street: ['', [Validators.required]],
          unit: [''],
          city: ['', [Validators.required]],
          state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
          postalCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9 -]{4,10}$/)]],
          country: ['US', [Validators.required]],
        }),
      }),

      // Step 2: Beneficial Owners
      beneficialOwners: this.fb.array([], [totalOwnershipValidator(), kycThresholdValidator()]),

      // Step 3: Banking & Settlement
      bankingDetails: this.fb.group(
        {
          bankName: ['', [Validators.required]],
          accountHolderName: ['', [Validators.required]],
          routingNumber: ['', [Validators.required, routingNumberValidator()]],
          accountNumber: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(17)]],
          confirmAccountNumber: ['', [Validators.required]],
          accountType: ['CHECKING', [Validators.required]],
        },
        { validators: [matchAccountsValidator('accountNumber', 'confirmAccountNumber')] }
      ),

      // Step 4: Processing Volume & Risk Profile
      processingProfile: this.fb.group(
        {
          estimatedMonthlyVolume: [
            50000,
            [Validators.required, Validators.min(1000), Validators.max(50000000)],
          ],
          averageTicketSize: [
            75,
            [Validators.required, Validators.min(1), Validators.max(500000)],
          ],
          maximumTicketSize: [
            500,
            [Validators.required, Validators.min(1), Validators.max(1000000)],
          ],
          primaryCurrency: ['USD', [Validators.required]],
          isHighRiskIndustry: [false],
          highRiskCategory: [''],
          highRiskExplanation: [''],
          chargebackRatioHistory: ['<0.5%', [Validators.required]],
        },
        { validators: [ticketSizeValidator()] }
      ),

      // Step 5: Submission & Attestation
      attestation: this.fb.group({
        certifiedAccurate: [false, [Validators.requiredTrue]],
        authorizedSignerName: ['', [Validators.required, Validators.minLength(2)]],
        signatureDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
      }),
    });

    // Seed default first owner
    this.addBeneficialOwner(true);

    // Watch dynamic risk explanation requirement
    const highRiskControl = this.wizardForm.get('processingProfile.isHighRiskIndustry');
    const explanationControl = this.wizardForm.get('processingProfile.highRiskExplanation');
    const categoryControl = this.wizardForm.get('processingProfile.highRiskCategory');

    this.sub.add(
      highRiskControl?.valueChanges.subscribe((isHighRisk) => {
        if (isHighRisk) {
          explanationControl?.setValidators([Validators.required, Validators.minLength(20)]);
          categoryControl?.setValidators([Validators.required]);
        } else {
          explanationControl?.clearValidators();
          categoryControl?.clearValidators();
        }
        explanationControl?.updateValueAndValidity();
        categoryControl?.updateValueAndValidity();
      })
    );
  }

  get beneficialOwners(): FormArray {
    return this.wizardForm.get('beneficialOwners') as FormArray;
  }

  addBeneficialOwner(isPrimary: boolean = false): void {
    const defaultPercentage = this.beneficialOwners.length === 0 ? 100 : 0;
    const ownerGroup = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      title: ['', [Validators.required]],
      ownershipPercentage: [
        defaultPercentage,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      ssn: ['', [Validators.required, Validators.pattern(/^\d{3}-?\d{2}-?\d{4}$/)]],
      dateOfBirth: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      isPrimaryContact: [isPrimary],
    });

    this.beneficialOwners.push(ownerGroup);
    this.wizardForm.markAsDirty();
  }

  setSampleRoutingNumber(code: string): void {
    const ctrl = this.wizardForm.get('bankingDetails.routingNumber');
    if (ctrl) {
      ctrl.setValue(code);
      ctrl.markAsDirty();
      ctrl.markAsTouched();
    }
  }

  removeBeneficialOwner(index: number): void {
    if (this.beneficialOwners.length > 1) {
      this.beneficialOwners.removeAt(index);
      this.wizardForm.markAsDirty();
    } else {
      this.notificationService.warning(
        'Requirement Notice',
        'At least one beneficial owner is mandatory for KYC under US CDD regulations.'
      );
    }
  }

  private initAutoSave(appId: string): void {
    this.autoSaveService.watchForm(this.wizardForm, appId);

    // Backup to localStorage on each change
    this.sub.add(
      this.wizardForm.valueChanges.subscribe((val) => {
        if (this.wizardForm.dirty) {
          localStorage.setItem('paygate_wizard_draft', JSON.stringify(val));
        }
      })
    );
  }

  private loadExistingApplication(id: string): void {
    this.appService.getApplicationById(id).subscribe({
      next: (app) => {
        this.patchApplicationData(app);
        this.initAutoSave(app.id);
        if (app.currentStep) {
          this.currentStep.set(Math.min(app.currentStep, 5));
        }
      },
      error: () => {
        this.notificationService.error('Error', `Could not load application ${id}`);
        this.initAutoSave('draft_fallback');
      },
    });
  }

  resumeSavedDraft(): void {
    try {
      const saved = localStorage.getItem('paygate_wizard_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.patchApplicationData(parsed);
        this.notificationService.success('Draft Restored', 'Resumed from previously saved session.');
      }
    } catch {
      this.notificationService.error('Draft Error', 'Could not parse local draft.');
    }
    this.draftBannerVisible.set(false);
  }

  discardDraft(): void {
    localStorage.removeItem('paygate_wizard_draft');
    this.draftBannerVisible.set(false);
    this.notificationService.info('Draft Discarded', 'Starting with a clean application form.');
  }

  private patchApplicationData(data: any): void {
    if (data.businessDetails) {
      this.wizardForm.get('businessDetails')?.patchValue(data.businessDetails);
    }

    if (data.beneficialOwners && Array.isArray(data.beneficialOwners)) {
      this.beneficialOwners.clear();
      data.beneficialOwners.forEach((owner: any) => {
        const group = this.fb.group({
          fullName: [owner.fullName || '', [Validators.required, Validators.minLength(2)]],
          title: [owner.title || '', [Validators.required]],
          ownershipPercentage: [
            owner.ownershipPercentage || 0,
            [Validators.required, Validators.min(1), Validators.max(100)],
          ],
          ssn: [owner.ssn || '', [Validators.required, Validators.pattern(/^\d{3}-?\d{2}-?\d{4}$/)]],
          dateOfBirth: [owner.dateOfBirth || '', [Validators.required]],
          email: [owner.email || '', [Validators.required, Validators.email]],
          isPrimaryContact: [!!owner.isPrimaryContact],
        });
        this.beneficialOwners.push(group);
      });
    }

    if (data.bankingDetails) {
      this.wizardForm.get('bankingDetails')?.patchValue({
        ...data.bankingDetails,
        confirmAccountNumber: data.bankingDetails.accountNumber,
      });
    }

    if (data.processingProfile) {
      this.wizardForm.get('processingProfile')?.patchValue(data.processingProfile);
    }

    if (data.attestation) {
      this.wizardForm.get('attestation')?.patchValue(data.attestation);
    }
  }

  // Step Validation & Navigation
  isStepValid(stepNumber: number): boolean {
    switch (stepNumber) {
      case 1:
        return this.wizardForm.get('businessDetails')!.valid;
      case 2:
        return this.beneficialOwners.valid;
      case 3:
        return this.wizardForm.get('bankingDetails')!.valid;
      case 4:
        return this.wizardForm.get('processingProfile')!.valid;
      case 5:
        return this.wizardForm.valid;
      default:
        return false;
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep()) {
      // Always allow navigating backwards
      this.currentStep.set(step);
      return;
    }

    // Only allow advancing if current step is valid
    if (this.validateCurrentStep()) {
      this.autoSaveService.saveNow();
      this.currentStep.set(step);
    }
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      this.autoSaveService.saveNow();
      this.currentStep.update((s) => Math.min(s + 1, this.totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousStep(): void {
    this.currentStep.update((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private validateCurrentStep(): boolean {
    const step = this.currentStep();
    let currentGroup: any;

    if (step === 1) currentGroup = this.wizardForm.get('businessDetails');
    if (step === 2) currentGroup = this.beneficialOwners;
    if (step === 3) currentGroup = this.wizardForm.get('bankingDetails');
    if (step === 4) currentGroup = this.wizardForm.get('processingProfile');
    if (step === 5) currentGroup = this.wizardForm;

    if (currentGroup && !currentGroup.valid) {
      currentGroup.markAllAsTouched();
      const invalidFields = this.getInvalidFieldNames(currentGroup);
      const fieldsMsg = invalidFields.length > 0 ? `: ${invalidFields.join(', ')}` : '';
      this.notificationService.warning(
        'Incomplete Fields',
        `Please correct the highlighted validation errors${fieldsMsg}.`
      );
      return false;
    }
    return true;
  }

  private getInvalidFieldNames(group: AbstractControl): string[] {
    const invalidNames: string[] = [];
    if (group instanceof FormGroup) {
      Object.keys(group.controls).forEach((key) => {
        const ctrl = group.get(key);
        if (ctrl && ctrl.invalid) {
          if (ctrl instanceof FormGroup) {
            invalidNames.push(...this.getInvalidFieldNames(ctrl));
          } else {
            invalidNames.push(this.formatFieldName(key));
          }
        }
      });
    } else if (group instanceof FormArray) {
      group.controls.forEach((item, idx) => {
        if (item.invalid) {
          invalidNames.push(`Owner #${idx + 1}`);
        }
      });
    }
    return invalidNames;
  }

  private formatFieldName(name: string): string {
    const map: Record<string, string> = {
      legalName: 'Legal Business Name',
      dbaName: 'Doing Business As (DBA)',
      taxId: 'Tax ID / EIN',
      businessType: 'Entity Type',
      incorporationDate: 'Incorporation Date',
      websiteUrl: 'Company Website URL',
      phone: 'Business Phone',
      street: 'Street Address',
      city: 'City',
      state: 'State',
      postalCode: 'Postal / ZIP Code',
      routingNumber: 'Routing Transit Number',
      accountNumber: 'Account Number',
      confirmAccountNumber: 'Confirm Account Number',
      estimatedMonthlyVolume: 'Estimated Monthly Volume',
      averageTicketSize: 'Average Ticket Size',
      maximumTicketSize: 'Maximum Ticket Size',
      highRiskExplanation: 'Risk Mitigation Explanation',
      certifiedAccurate: 'Attestation Certification',
      authorizedSignerName: 'Authorized Signer Name',
    };
    return map[name] || name;
  }

  submitApplication(): void {
    if (!this.wizardForm.valid) {
      this.wizardForm.markAllAsTouched();
      this.notificationService.error(
        'Validation Incomplete',
        'Please complete all required fields and attestation before submission.'
      );
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.wizardForm.getRawValue();
    const currentUser = this.authService.currentUser();

    const applicationPayload: Partial<MerchantApplication> = {
      ...formValue,
      salesRepId: currentUser?.id || 'usr_sales_01',
      salesRepName: currentUser?.name || 'Sarah Jenkins',
      currentStep: 5,
    };

    this.appService.createApplication(applicationPayload).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        localStorage.removeItem('paygate_wizard_draft');
        this.notificationService.success(
          'Application Submitted!',
          `Application ${created.applicationNumber} successfully submitted for underwriting review.`
        );
        this.router.navigate(['/applications', created.id]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notificationService.error(
          'Submission Failed',
          err.message || 'Server rejected application submission.'
        );
      },
    });
  }

  ngOnDestroy(): void {
    this.autoSaveService.stopWatching();
    this.sub.unsubscribe();
  }
}

