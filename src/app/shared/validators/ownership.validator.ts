import { AbstractControl, FormArray, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that the sum of ownership percentages across all owners does not exceed 100%.
 */
export function totalOwnershipValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) {
      return null;
    }

    let total = 0;
    control.controls.forEach((group) => {
      const percentage = Number(group.get('ownershipPercentage')?.value) || 0;
      total += percentage;
    });

    if (total > 100) {
      return {
        totalOwnershipExceeded: {
          message: 'Total beneficial ownership percentage cannot exceed 100%',
          currentTotal: total,
        },
      };
    }

    return null;
  };
}

/**
 * Validates that at least one owner has >= 25% ownership (FinCEN CDD Rule)
 */
export function kycThresholdValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) {
      return null;
    }

    if (control.length === 0) {
      return { noOwners: { message: 'At least one beneficial owner is required' } };
    }

    const hasSignificantOwner = control.controls.some((group) => {
      const percentage = Number(group.get('ownershipPercentage')?.value) || 0;
      return percentage >= 25;
    });

    if (!hasSignificantOwner) {
      return {
        missingSignificantOwner: {
          message:
            'FinCEN regulations require at least one beneficial owner with 25% or greater equity',
        },
      };
    }

    return null;
  };
}

