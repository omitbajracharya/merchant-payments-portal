import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { describe, it, expect, beforeEach } from 'vitest';
import { ApplicationWizardComponent } from './application-wizard.component';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationService } from '../../core/services/application.service';

describe('ApplicationWizardComponent (Multi-step Reactive Forms & Auto-Save)', () => {
  let component: ApplicationWizardComponent;
  let fixture: ComponentFixture<ApplicationWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationWizardComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        ApplicationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize at Step 1 with a default primary owner', () => {
    expect(component.currentStep()).toBe(1);
    expect(component.beneficialOwners.length).toBe(1);
    expect(component.beneficialOwners.at(0).get('isPrimaryContact')?.value).toBe(true);
  });

  it('should allow adding and removing beneficial owners', () => {
    expect(component.beneficialOwners.length).toBe(1);

    component.addBeneficialOwner(false);
    expect(component.beneficialOwners.length).toBe(2);

    component.removeBeneficialOwner(1);
    expect(component.beneficialOwners.length).toBe(1);
  });

  it('should enforce step validation before advancing', () => {
    // Step 1 is invalid initially because fields are empty
    expect(component.isStepValid(1)).toBe(false);

    // Populate valid step 1 fields
    component.wizardForm.get('businessDetails')?.patchValue({
      legalName: 'Apex Mountain Goods LLC',
      taxId: '12-3456789',
      businessType: 'LLC',
      incorporationDate: '2020-01-01',
      websiteUrl: 'https://apexgoods-demo.com',
      phone: '(415) 555-1234',
      industryCategory: 'Retail - E-Commerce',
      address: {
        street: '123 Market St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US',
      },
    });

    expect(component.isStepValid(1)).toBe(true);
  });

  it('should dynamically require highRiskExplanation when isHighRiskIndustry is checked', () => {
    const processingGroup = component.wizardForm.get('processingProfile');
    const highRiskControl = processingGroup?.get('isHighRiskIndustry');
    const explanationControl = processingGroup?.get('highRiskExplanation');

    expect(explanationControl?.validator).toBeNull();

    highRiskControl?.setValue(true);
    expect(explanationControl?.validator).toBeDefined();

    // With less than 20 chars, it should be invalid
    explanationControl?.setValue('Too short');
    expect(explanationControl?.invalid).toBe(true);

    explanationControl?.setValue('Comprehensive AML controls and fraud screening via Ethoca and Verifi.');
    expect(explanationControl?.valid).toBe(true);
  });
});

