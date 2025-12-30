import { inject, Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs/operators';

@Injectable()
export abstract class BasePropertiesFormService<T extends Record<string, any>> {
  protected fb = inject(FormBuilder);
  protected form!: FormGroup;
  protected destroy$ = new Subject<void>();

  abstract createFormControls(): { [key: string]: any };

  createForm(): FormGroup {
    this.form = this.fb.group(this.createFormControls());
    return this.form;
  }

  getForm(): FormGroup {
    return this.form;
  }

  patchForm(properties: Partial<T>, silent = false): void {
    this.form.patchValue(properties, { emitEvent: !silent });
  }

  subscribeToChanges(callback: (properties: Partial<T>) => void, debounceMs = 300): void {
    this.form.valueChanges
      .pipe(debounceTime(debounceMs), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        callback(value);
      });
  }

  subscribeToImmediateChanges(fields: string[], callback: (properties: Partial<T>) => void): void {
    fields.forEach((field) => {
      const control = this.form.get(field);
      if (control) {
        control.valueChanges
          .pipe(skip(1), distinctUntilChanged(), takeUntil(this.destroy$))
          .subscribe(() => {
            callback(this.form.value);
          });
      }
    });
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
