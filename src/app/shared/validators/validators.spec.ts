import { describe, it, expect } from 'vitest';
import { FormControl, FormGroup, FormArray } from '@angular/forms';
import { einValidator } from './ein.validator';
import { routingNumberValidator } from './routing-number.validator';
import { totalOwnershipValidator, kycThresholdValidator } from './ownership.validator';
import { ticketSizeValidator, matchAccountsValidator } from './ticket-size.validator';

describe('Custom Financial Validators', () => {
  describe('einValidator', () => {
    const validator = einValidator();

    it('should validate valid EIN formats', () => {
      const c1 = new FormControl('12-3456789');
      const c2 = new FormControl('987654321');
      expect(validator(c1)).toBeNull();
      expect(validator(c2)).toBeNull();
    });

    it('should reject invalid length or characters', () => {
      const c1 = new FormControl('123');
      const c2 = new FormControl('12-345678A');
      expect(validator(c1)).toEqual(expect.objectContaining({ invalidEin: expect.anything() }));
      expect(validator(c2)).toEqual(expect.objectContaining({ invalidEin: expect.anything() }));
    });

    it('should reject prefix 00', () => {
      const c = new FormControl('00-1234567');
      expect(validator(c)).toEqual(
        expect.objectContaining({ invalidEinPrefix: expect.anything() })
      );
    });

    it('should allow empty value (leave presence to required)', () => {
      const c = new FormControl('');
      expect(validator(c)).toBeNull();
    });
  });

  describe('routingNumberValidator (Federal Reserve Checksum)', () => {
    const validator = routingNumberValidator();

    it('should accept valid ABA routing numbers with correct checksum', () => {
      // 011000015 (Federal Reserve Bank of Boston)
      // 3*(0+0+0) + 7*(1+0+1) + 1*(1+0+5) = 0 + 14 + 6 = 20 (20 % 10 === 0)
      const c1 = new FormControl('011000015');
      // 121000358 (Bank of America, San Francisco)
      // 3*(1+0+3) + 7*(2+0+5) + 1*(1+0+8) = 12 + 49 + 9 = 70 (70 % 10 === 0)
      const c2 = new FormControl('121000358');
      expect(validator(c1)).toBeNull();
      expect(validator(c2)).toBeNull();
    });

    it('should reject routing numbers with invalid checksum', () => {
      const c = new FormControl('121000359'); // Bad check digit
      expect(validator(c)).toEqual(
        expect.objectContaining({ invalidRoutingChecksum: expect.anything() })
      );
    });

    it('should reject routing numbers with incorrect length', () => {
      const c = new FormControl('12345678'); // 8 digits
      expect(validator(c)).toEqual(
        expect.objectContaining({ routingNumberLength: expect.anything() })
      );
    });
  });

  describe('Ownership Validators', () => {
    it('should accept ownership <= 100%', () => {
      const validator = totalOwnershipValidator();
      const arr = new FormArray([
        new FormGroup({ ownershipPercentage: new FormControl(50) }),
        new FormGroup({ ownershipPercentage: new FormControl(50) }),
      ]);
      expect(validator(arr)).toBeNull();
    });

    it('should reject total ownership > 100%', () => {
      const validator = totalOwnershipValidator();
      const arr = new FormArray([
        new FormGroup({ ownershipPercentage: new FormControl(60) }),
        new FormGroup({ ownershipPercentage: new FormControl(45) }),
      ]);
      expect(validator(arr)).toEqual(
        expect.objectContaining({ totalOwnershipExceeded: expect.anything() })
      );
    });

    it('should enforce FinCEN 25% KYC threshold', () => {
      const validator = kycThresholdValidator();
      const validArr = new FormArray([
        new FormGroup({ ownershipPercentage: new FormControl(25) }),
        new FormGroup({ ownershipPercentage: new FormControl(10) }),
      ]);
      expect(validator(validArr)).toBeNull();

      const invalidArr = new FormArray([
        new FormGroup({ ownershipPercentage: new FormControl(20) }),
        new FormGroup({ ownershipPercentage: new FormControl(20) }),
      ]);
      expect(validator(invalidArr)).toEqual(
        expect.objectContaining({ missingSignificantOwner: expect.anything() })
      );
    });
  });

  describe('ticketSizeValidator', () => {
    const validator = ticketSizeValidator();

    it('should pass when max >= avg', () => {
      const form = new FormGroup({
        averageTicketSize: new FormControl(100),
        maximumTicketSize: new FormControl(500),
      });
      expect(validator(form)).toBeNull();
    });

    it('should fail when max < avg', () => {
      const form = new FormGroup({
        averageTicketSize: new FormControl(500),
        maximumTicketSize: new FormControl(100),
      });
      expect(validator(form)).toEqual(
        expect.objectContaining({ maxTicketLessThanAverage: expect.anything() })
      );
    });
  });

  describe('matchAccountsValidator', () => {
    const validator = matchAccountsValidator();

    it('should pass when account and confirm match', () => {
      const form = new FormGroup({
        accountNumber: new FormControl('9876543210'),
        confirmAccountNumber: new FormControl('9876543210'),
      });
      expect(validator(form)).toBeNull();
    });

    it('should fail when account numbers do not match', () => {
      const form = new FormGroup({
        accountNumber: new FormControl('9876543210'),
        confirmAccountNumber: new FormControl('9876543211'),
      });
      expect(validator(form)).toEqual(
        expect.objectContaining({ accountMismatch: expect.anything() })
      );
    });
  });
});

