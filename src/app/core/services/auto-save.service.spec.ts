import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutoSaveService } from './auto-save.service';
import { ApplicationService } from './application.service';

describe('AutoSaveService (RxJS Debounce & State Persistence)', () => {
  let service: AutoSaveService;
  let appServiceMock: { saveDraft: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    appServiceMock = {
      saveDraft: vi.fn().mockReturnValue(of({ success: true })),
    };

    TestBed.configureTestingModule({
      providers: [
        AutoSaveService,
        { provide: ApplicationService, useValue: appServiceMock },
      ],
    });

    service = TestBed.inject(AutoSaveService);
  });

  it('should initialize with idle status', () => {
    expect(service.status()).toBe('idle');
    expect(service.lastSavedTime()).toBeNull();
  });

  it('should save draft immediately on saveNow()', () => {
    const form = new FormGroup({
      name: new FormControl('Test Merchant'),
    });

    service.watchForm(form, 'app_test_1');
    service.saveNow();

    expect(appServiceMock.saveDraft).toHaveBeenCalledWith(
      'app_test_1',
      expect.objectContaining({ name: 'Test Merchant' })
    );
    expect(service.status()).toBe('saved');
    expect(service.lastSavedTime()).toBeInstanceOf(Date);
  });

  it('should handle draft save errors gracefully without breaking form', () => {
    appServiceMock.saveDraft.mockReturnValue(
      throwError(() => new Error('Network timeout'))
    );

    const form = new FormGroup({
      name: new FormControl('Test'),
    });

    service.watchForm(form, 'app_test_error');
    service.saveNow();

    expect(service.status()).toBe('error');
    expect(service.errorMessage()).toContain('Failed to auto-save');
  });
});

