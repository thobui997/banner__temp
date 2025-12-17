import { CommonModule } from '@angular/common';
import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonStyle } from '@gsf/admin/app/shared/types';

@Component({
  selector: 'app-style-control',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StyleControlComponent),
      multi: true
    }
  ],
  template: `
    <div class="grid grid-cols-3 border border-stroke-primary-2 rounded-lg overflow-hidden">
      <button
        type="button"
        class="p-2 border rounded-lg text-sm font-medium text-text-primary-2"
        [ngClass]="{ 'border-theme-neutral-color-4 border': value === 'fill' }"
        (click)="onStyleChange('fill')"
        [attr.aria-label]="'button fill'"
        [attr.aria-pressed]="value === 'fill'"
        [disabled]="disabled"
      >
        Fill
      </button>

      <button
        type="button"
        class="p-2 rounded-lg text-sm font-medium text-text-primary-2"
        [ngClass]="{ 'border-theme-neutral-color-4 border': value === 'outline' }"
        (click)="onStyleChange('outline')"
        [attr.aria-label]="'button outline'"
        [attr.aria-pressed]="value === 'outline'"
        [disabled]="disabled"
      >
        Outline
      </button>

      <button
        type="button"
        class="p-2 rounded-lg text-sm font-medium text-text-primary-2"
        [ngClass]="{ 'border-theme-neutral-color-4 border': value === 'text' }"
        (click)="onStyleChange('text')"
        [attr.aria-label]="'button text'"
        [attr.aria-pressed]="value === 'text'"
        [disabled]="disabled"
      >
        Text
      </button>
    </div>
  `,
  imports: [CommonModule]
})
export class StyleControlComponent implements ControlValueAccessor {
  value: ButtonStyle = 'fill';
  disabled = false;

  private onChange?: (value: ButtonStyle) => void;
  private onTouched?: () => void;

  writeValue(value: ButtonStyle): void {
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

  onStyleChange(newStyle: ButtonStyle): void {
    if (this.value !== newStyle && !this.disabled) {
      this.value = newStyle;
      this.onChange?.(this.value);
      this.onTouched?.();
    }
  }
}
