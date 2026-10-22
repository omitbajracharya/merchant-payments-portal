import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  catchError,
  filter,
} from 'rxjs/operators';
import { ApplicationService } from './application.service';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

@Injectable({
  providedIn: 'root',
})
export class AutoSaveService implements OnDestroy {
  private readonly appService = inject(ApplicationService);

  // Reactive state signals
  readonly status = signal<AutoSaveStatus>('idle');
  readonly lastSavedTime = signal<Date | null>(null);
  readonly errorMessage = signal<string | null>(null);

  private saveSubscription?: Subscription;
  private readonly manualSaveTrigger$ = new Subject<any>();
  private currentForm?: FormGroup;
  private currentAppId: string = 'draft_temp';

  /**
   * Initializes the auto-save pipeline on a Reactive FormGroup
   */
  watchForm(form: FormGroup, applicationId: string = 'draft_temp'): void {
    this.stopWatching();
    this.currentForm = form;
    this.currentAppId = applicationId;
    this.status.set('idle');
    this.errorMessage.set(null);

    // Stream from form changes debounced + distinct
    const formChanges$ = form.valueChanges.pipe(
      filter(() => form.dirty),
      debounceTime(1200),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );

    // Merge with manual save triggers
    const savePipeline$ = new Subject<any>();

    const sub1 = formChanges$.subscribe((val) => savePipeline$.next(val));
    const sub2 = this.manualSaveTrigger$.subscribe((val) => savePipeline$.next(val));

    this.saveSubscription = savePipeline$
      .pipe(
        tap(() => {
          this.status.set('saving');
          this.errorMessage.set(null);
        }),
        switchMap((formVal) =>
          this.appService.saveDraft(this.currentAppId, formVal).pipe(
            tap(() => {
              this.status.set('saved');
              this.lastSavedTime.set(new Date());
              // Do not reset form controls or dirty flags abruptly so user doesn't lose focus
            }),
            catchError((err) => {
              this.status.set('error');
              this.errorMessage.set('Failed to auto-save draft. Please click Retry.');
              return of(null);
            })
          )
        )
      )
      .subscribe();

    // Store compound subscription
    this.saveSubscription.add(sub1);
    this.saveSubscription.add(sub2);
  }

  /**
   * Immediately saves the current form state (e.g. on step transition or manual Save button)
   */
  saveNow(): void {
    if (this.currentForm) {
      this.manualSaveTrigger$.next(this.currentForm.getRawValue());
    }
  }

  /**
   * Retries saving after an error
   */
  retry(): void {
    this.saveNow();
  }

  stopWatching(): void {
    if (this.saveSubscription) {
      this.saveSubscription.unsubscribe();
      this.saveSubscription = undefined;
    }
    this.currentForm = undefined;
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }
}

