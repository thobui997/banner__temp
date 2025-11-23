import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FrameRatioService } from '../../services/frame/frame-ratio.service';
import { FrameRatioType, FrameRatio, FRAME_RATIOS } from '../../types/frame-ratio.type';
import { Observable } from 'rxjs';

/**
 * Frame Ratio Selector Component
 *
 * Component cho phép người dùng chọn tỉ lệ khung hình.
 * Features:
 * - Dropdown để chọn tỉ lệ (1:2, 16:9, 4:3, 9:16, 1:1, custom)
 * - Preview tỉ lệ hiện tại
 * - Custom dimensions input
 * - Real-time update khi thay đổi
 *
 * Angular Best Practices:
 * - Standalone component
 * - Reactive with Observables
 * - Dependency Injection
 * - Type-safe with TypeScript
 */
@Component({
  selector: 'app-frame-ratio-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="frame-ratio-selector">
      <div class="selector-header">
        <label class="selector-label">Frame Ratio</label>
      </div>

      <div class="selector-body">
        <!-- Ratio Dropdown -->
        <select
          class="ratio-select"
          [value]="currentRatio$ | async"
          (change)="onRatioChange($event)"
        >
          <option *ngFor="let ratio of availableRatios" [value]="ratio.type">
            {{ ratio.label }}
          </option>
        </select>

        <!-- Custom Dimensions Input (show only when custom is selected) -->
        <div
          *ngIf="(currentRatio$ | async) === 'custom'"
          class="custom-dimensions"
        >
          <div class="dimension-input-group">
            <label>Width</label>
            <input
              type="number"
              [(ngModel)]="customWidth"
              (change)="onCustomDimensionsChange()"
              min="100"
              max="2000"
              class="dimension-input"
            />
          </div>

          <div class="dimension-input-group">
            <label>Height</label>
            <input
              type="number"
              [(ngModel)]="customHeight"
              (change)="onCustomDimensionsChange()"
              min="100"
              max="2000"
              class="dimension-input"
            />
          </div>

          <button
            class="apply-button"
            (click)="onCustomDimensionsChange()"
          >
            Apply
          </button>
        </div>

        <!-- Current Ratio Display -->
        <div class="ratio-display">
          <div class="ratio-preview">
            <div
              class="preview-box"
              [style.aspect-ratio]="previewAspectRatio"
            ></div>
          </div>
          <span class="ratio-text">{{ currentRatioText }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .frame-ratio-selector {
        padding: 16px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }

      .selector-header {
        margin-bottom: 12px;
      }

      .selector-label {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .selector-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ratio-select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        color: #374151;
        background: white;
        cursor: pointer;
      }

      .ratio-select:focus {
        outline: none;
        border-color: #764FDB;
        box-shadow: 0 0 0 3px rgba(118, 79, 219, 0.1);
      }

      .custom-dimensions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 6px;
      }

      .dimension-input-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dimension-input-group label {
        font-size: 13px;
        color: #6b7280;
        min-width: 50px;
      }

      .dimension-input {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 13px;
      }

      .dimension-input:focus {
        outline: none;
        border-color: #764FDB;
      }

      .apply-button {
        padding: 6px 12px;
        background: #764FDB;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .apply-button:hover {
        background: #5a3ba8;
      }

      .ratio-display {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 6px;
      }

      .ratio-preview {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e5e7eb;
        border-radius: 4px;
      }

      .preview-box {
        background: #764FDB;
        border-radius: 2px;
        width: 80%;
        height: 80%;
      }

      .ratio-text {
        font-size: 13px;
        color: #6b7280;
        font-weight: 500;
      }
    `
  ]
})
export class FrameRatioSelectorComponent implements OnInit {
  private ratioService = inject(FrameRatioService);

  // Observables
  currentRatio$!: Observable<FrameRatioType>;

  // Available ratios
  availableRatios: FrameRatio[] = [];

  // Custom dimensions
  customWidth: number = 400;
  customHeight: number = 400;

  // Preview
  previewAspectRatio: string = '1 / 2';
  currentRatioText: string = '1:2';

  ngOnInit(): void {
    // Get available ratios
    this.availableRatios = this.ratioService.getAllRatios();

    // Subscribe to current ratio
    this.currentRatio$ = this.ratioService.currentRatio$;

    // Update preview when ratio changes
    this.currentRatio$.subscribe((ratio) => {
      this.updatePreview(ratio);
    });
  }

  /**
   * Handle ratio change from dropdown
   */
  onRatioChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newRatio = selectElement.value as FrameRatioType;

    if (newRatio === 'custom') {
      // Don't change immediately, wait for user to input custom dimensions
      return;
    }

    this.ratioService.changeFrameRatio(newRatio);
  }

  /**
   * Handle custom dimensions change
   */
  onCustomDimensionsChange(): void {
    if (this.customWidth > 0 && this.customHeight > 0) {
      this.ratioService.setCustomDimensions({
        width: this.customWidth,
        height: this.customHeight
      });
    }
  }

  /**
   * Update preview based on current ratio
   */
  private updatePreview(ratioType: FrameRatioType): void {
    const ratio = this.ratioService.getFrameRatio(ratioType);

    // Calculate aspect ratio for CSS
    this.previewAspectRatio = `${ratio.width} / ${ratio.height}`;

    // Calculate simplified ratio text
    if (ratioType === 'custom') {
      const calculatedRatio = this.ratioService.calculateRatioFromDimensions(
        this.customWidth,
        this.customHeight
      );
      this.currentRatioText = `${calculatedRatio} (${this.customWidth}x${this.customHeight})`;
    } else {
      this.currentRatioText = `${ratioType} (${ratio.width}x${ratio.height})`;
    }
  }
}
