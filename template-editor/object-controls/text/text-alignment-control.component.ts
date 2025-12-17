import { CommonModule } from '@angular/common';
import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TextAlignment } from '@gsf/admin/app/shared/types';
import {
  ICON_TEXT_ALIGN_CENTER,
  ICON_TEXT_ALIGN_LEFT,
  ICON_TEXT_ALIGN_RIGHT,
  IconSvgComponent
} from '@gsf/ui';

@Component({
  selector: 'app-text-alignment',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextAlignmentControlComponent),
      multi: true
    }
  ],
  template: `
    <div class="flex items-center w-fit border border-stroke-primary-2 rounded-lg overflow-hidden">
      <button
        type="button"
        class="py-2 px-4 border rounded-lg"
        [ngClass]="{ 'border-theme-neutral-color-4 border': value === 'left' }"
        (click)="onAlignmentChange('left')"
        [attr.aria-label]="'align left'"
        [attr.aria-pressed]="value === 'left'"
        [disabled]="disabled"
      >
        <gsf-icon-svg [icon]="ICON_TEXT_ALIGN_LEFT" />
      </button>

      <button
        type="button"
        class="py-2 px-4 rounded-lg"
        [ngClass]="{ 'border-theme-neutral-color-4 border': value === 'center' }"
        (click)="onAlignmentChange('center')"
        [attr.aria-label]="'align center'"
        [attr.aria-pressed]="value === 'center'"
        [disabled]="disabled"
      >
        <gsf-icon-svg [icon]="ICON_TEXT_ALIGN_CENTER" />
      </button>

      <button
        type="button"
        class="py-2 px-4 rounded-lg"
        [ngClass]="{ 'border-theme-neutral-color-4 border': value === 'right' }"
        (click)="onAlignmentChange('right')"
        [attr.aria-label]="'align right'"
        [attr.aria-pressed]="value === 'right'"
        [disabled]="disabled"
      >
        <gsf-icon-svg [icon]="ICON_TEXT_ALIGN_RIGHT" />
      </button>
    </div>
  `,
  imports: [IconSvgComponent, CommonModule]
})
export class TextAlignmentControlComponent implements ControlValueAccessor {
  readonly ICON_TEXT_ALIGN_LEFT = ICON_TEXT_ALIGN_LEFT;
  readonly ICON_TEXT_ALIGN_CENTER = ICON_TEXT_ALIGN_CENTER;
  readonly ICON_TEXT_ALIGN_RIGHT = ICON_TEXT_ALIGN_RIGHT;

  value: TextAlignment = 'left';
  disabled = false;

  private onChange?: (value: TextAlignment) => void;
  private onTouched?: () => void;

  writeValue(value: TextAlignment): void {
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

  onAlignmentChange(newAlignment: TextAlignment): void {
    if (this.value !== newAlignment && !this.disabled) {
      this.value = newAlignment;
      this.onChange?.(this.value);
      this.onTouched?.();
    }
  }
}
