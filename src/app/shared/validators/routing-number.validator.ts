import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates US ABA Routing Transit Number using Federal Reserve checksum formula.
 * Must be 9 numeric digits.
 * Checksum algorithm:
 *   (3 * (d0 + d3 + d6) + 7 * (d1 + d4 + d7) + 1 * (d2 + d5 + d8)) % 10 === 0
 */
export function routingNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = String(control.value).replace(/\D/g, '');

    if (value.length !== 9) {
      return {
        routingNumberLength: {
          message: 'ABA Routing number must be exactly 9 digits',
          actualLength: value.length,
        },
      };
    }

    const digits = value.split('').map(Number);
    const checksum =
      3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      1 * (digits[2] + digits[5] + digits[8]);

    if (checksum % 10 !== 0) {
      return {
        invalidRoutingChecksum: {
          message: 'Invalid ABA routing transit number checksum',
          actual: value,
        },
      };
    }

    return null;
  };
}

