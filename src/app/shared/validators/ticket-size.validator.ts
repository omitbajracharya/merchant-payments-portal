import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Cross-field validator ensuring Maximum Ticket Size is greater than or equal to Average Ticket Size
 */
export function ticketSizeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const avg = control.get('averageTicketSize')?.value;
    const max = control.get('maximumTicketSize')?.value;

    if (avg != null && max != null && avg !== '' && max !== '') {
      const avgNum = Number(avg);
      const maxNum = Number(max);

      if (!isNaN(avgNum) && !isNaN(maxNum) && maxNum < avgNum) {
        return {
          maxTicketLessThanAverage: {
            message: 'Maximum ticket size must be greater than or equal to average ticket size',
            averageTicket: avgNum,
            maximumTicket: maxNum,
          },
        };
      }
    }

    return null;
  };
}

/**
 * Cross-field validator ensuring Account Number and Confirm Account Number match
 */
export function matchAccountsValidator(
  accountField: string = 'accountNumber',
  confirmField: string = 'confirmAccountNumber'
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const account = control.get(accountField)?.value;
    const confirm = control.get(confirmField)?.value;

    if (account && confirm && account !== confirm) {
      return {
        accountMismatch: {
          message: 'Account numbers do not match',
        },
      };
    }

    return null;
  };
}

