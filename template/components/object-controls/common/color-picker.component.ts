import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { WrapOverlayComponent } from '@gsf/admin/app/shared/components';
import { OverlayTriggerDirective } from '@gsf/admin/app/shared/directives';
import { ButtonDirective, ICON_ADD_SQUARE, ICON_CLOSE, IconSvgComponent } from '@gsf/ui';
import { ColorEvent } from 'ngx-color';
import { ColorSketchModule } from 'ngx-color/sketch';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    WrapOverlayComponent,
    OverlayTriggerDirective,
    ColorSketchModule,
    IconSvgComponent
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorPickerComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col gap-2">
      @if (presets.size > 0) {
        <div class="flex flex-col gap-1">
          @for (preset of presetsArray; track preset) {
            <div
              class="flex items-center gap-2 hover:bg-gray-100 p-1 rounded transition-colors group"
              [class.ring-2]="value === preset"
              [class.ring-blue-500]="value === preset"
            >
              <button
                type="button"
                class="flex items-center gap-2 flex-1 cursor-pointer"
                (click)="selectPreset(preset)"
              >
                <div
                  class="w-6 h-6 rounded border border-gray-300"
                  [style.background-color]="preset"
                ></div>
                <div class="text-sm text-gray-700 font-mono">{{ preset }}</div>
              </button>

              <button
                type="button"
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-icon-feature-icon-error-1"
                (click)="removePreset(preset)"
              >
                <gsf-icon-svg [icon]="ICON_CLOSE" />
              </button>
            </div>
          }
        </div>
      }

      @if (presetsArray.length < 5) {
        <button
          gsfButton
          appColor="tertiary"
          class="p-0 w-fit"
          type="button"
          #overlayTrigger="overlayTrigger"
          [overlayTrigger]="colorPickerTmpl"
        >
          <gsf-icon-svg [icon]="ICON_ADD_SQUARE" />
        </button>
      }
    </div>

    <!-- Color picker overlay -->
    <app-wrap-overlay #colorPickerTmpl>
      <div
        class="p-2 bg-white shadow-md border border-stroke-primary-2 rounded-lg editor-color-picker"
      >
        <color-sketch
          [color]="currentPickerColor"
          (onChangeComplete)="changeComplete($event)"
        ></color-sketch>

        <div class="mt-2 flex gap-2 justify-end">
          <button
            gsfButton
            appSize="sm"
            appColor="secondary"
            type="button"
            (click)="cancelColorPicker()"
          >
            Cancel
          </button>
          <button
            gsfButton
            appSize="sm"
            class="w-[60px]"
            appColor="primary"
            type="button"
            (click)="addColorToPresets()"
          >
            ok
          </button>
        </div>
      </div>
    </app-wrap-overlay>
  `,
  styles: [
    `
      .editor-color-picker .sketch-picker {
        background-color: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
      }
    `
  ]
})
export class ColorPickerComponent implements ControlValueAccessor {
  @ViewChild('colorInput') colorInput?: ElementRef<HTMLInputElement>;
  @ViewChild('overlayTrigger', { read: OverlayTriggerDirective })
  overlayTrigger?: OverlayTriggerDirective;

  @Input() presets = new Set<string>();
  @Output() presetsChange = new EventEmitter<Set<string>>();

  value: string | null = null;
  disabled = false;
  currentPickerColor = '#000000';

  ICON_ADD_SQUARE = ICON_ADD_SQUARE;
  ICON_CLOSE = ICON_CLOSE;

  private onChange?: (value: string | null) => void;
  private onTouchedCallback?: () => void;

  get presetsArray(): string[] {
    return Array.from(this.presets);
  }

  writeValue(value: string | null): void {
    this.value = value;
    if (value) {
      this.currentPickerColor = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onTouched() {
    this.onTouchedCallback?.();
  }

  changeComplete(event: ColorEvent) {
    const { color } = event;
    this.currentPickerColor = color.hex.toUpperCase() || '#000000';
  }

  updateValue(val: string | null) {
    this.value = val;
    this.onChange?.(this.value);
  }

  selectPreset(hex: string) {
    this.updateValue(hex);
    this.onTouched();
  }

  addColorToPresets() {
    if (this.currentPickerColor) {
      this.presets.add(this.currentPickerColor);
      this.presetsChange.emit(this.presets);

      this.updateValue(this.currentPickerColor);
      this.onTouched();

      this.closeOverlay();
    }
  }

  removePreset(hex: string) {
    this.presets.delete(hex);
    this.presetsChange.emit(this.presets);

    if (this.value === hex) {
      this.updateValue(null);
      this.onTouched();
    }
  }

  cancelColorPicker() {
    this.currentPickerColor = this.value || '#000000';
    this.closeOverlay();
  }

  private closeOverlay() {
    this.overlayTrigger?.closeOverlay();
  }
}
