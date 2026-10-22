import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates US Employer Identification Number (EIN / Tax ID)
 * Format: XX-XXXXXXX (9 digits, 2 digits followed by hyphen and 7 digits)
 */
export function einValidator(): ValidatorFn {
  const EIN_REGEX = /^\d{2}-\d{7}$/;
  const CLEAN_EIN_REGEX = /^\d{9}$/;

  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Don't validate empty values; use Validators.required for presence
    }

    const value = String(control.value).trim();

    // Check with hyphen format or raw 9-digit format
    if (EIN_REGEX.test(value)) {
      // Prefix cannot be '00'
      if (value.startsWith('00')) {
        return { invalidEinPrefix: { message: 'EIN prefix cannot be 00' } };
      }
      return null;
    }

    if (CLEAN_EIN_REGEX.test(value)) {
      if (value.startsWith('00')) {
        return { invalidEinPrefix: { message: 'EIN prefix cannot be 00' } };
      }
      return null;
    }

    return {
      invalidEin: {
        message: 'Tax ID / EIN must be in XX-XXXXXXX or 9-digit format',
        actual: value,
      },
    };
  };
}

