import { CommonModule } from '@angular/common';
import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonShape } from '@gsf/admin/app/shared/types';

@Component({
  selector: 'app-shape-control',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShapeControlComponent),
      multi: true
    }
  ],
  template: `
    <div class="grid grid-cols-3 border border-stroke-primary-2 rounded-lg overflow-hidden">
      <button
        type="button"
        class="p-2 border rounded-lg text-sm font-medium text-text-primary-2"
        [ngClass]="{ 'border-theme-neutral-color-4 border': value === 'rectangle' }"
        (click)="onShapeChange('rectangle')"
        [attr.aria-label]="'button rectangle'"
        [attr.aria-pressed]="value === 'rectangle'"
        [disabled]="disabled"
      >
        Rectangle
      </button>

      <button
        type="button"
        class="p-2 rounded-lg text-sm font-medium text-text-primary-2"
        [ngClass]="{ 'border-theme-neutral-color-4 border': value === 'rounded' }"
        (click)="onShapeChange('rounded')"
        [attr.aria-label]="'button rounded'"
        [attr.aria-pressed]="value === 'rounded'"
        [disabled]="disabled"
      >
        Rounded
      </button>

      <button
        type="button"
        class="p-2 rounded-lg text-sm font-medium text-text-primary-2"
        [ngClass]="{ 'border-theme-neutral-color-4 border': value === 'pill' }"
        (click)="onShapeChange('pill')"
        [attr.aria-label]="'button pill'"
        [attr.aria-pressed]="value === 'pill'"
        [disabled]="disabled"
      >
        Pill
      </button>
    </div>
  `,
  imports: [CommonModule]
})
export class ShapeControlComponent implements ControlValueAccessor {
  value: ButtonShape = 'rectangle';
  disabled = false;

  private onChange?: (value: ButtonShape) => void;
  private onTouched?: () => void;

  writeValue(value: ButtonShape): void {
    if (value) {
      this.value = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onShapeChange(newShape: ButtonShape): void {
    if (this.value !== newShape && !this.disabled) {
      this.value = newShape;
      this.onChange?.(this.value);
      this.onTouched?.();
    }
  }
}
