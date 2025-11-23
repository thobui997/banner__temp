import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FabricObject } from 'fabric';
import { FrameRatioType, FrameRatio, FRAME_RATIOS, FrameDimensions } from '../../types/frame-ratio.type';
import { CanvasStateService } from '../canvas/canvas-state.service';

/**
 * Frame Ratio Service
 *
 * Service quản lý tỉ lệ khung hình (aspect ratio) của frame.
 * Chức năng:
 * - Thay đổi tỉ lệ frame (1:2, 16:9, 4:3, 9:16, 1:1, custom)
 * - Scale toàn bộ nội dung trong frame theo tỉ lệ mới
 * - Maintain layout khi thay đổi tỉ lệ
 * - Observable để UI có thể reactive
 *
 * SOLID Principles:
 * - Single Responsibility: Chỉ quản lý frame ratio và scaling
 * - Dependency Injection: Inject CanvasStateService
 * - Open/Closed: Có thể extend để thêm ratios mới
 */
@Injectable()
export class FrameRatioService {
  private stateService = inject(CanvasStateService);

  // Current frame ratio state
  private currentRatioSubject = new BehaviorSubject<FrameRatioType>('1:2');
  private customDimensionsSubject = new BehaviorSubject<FrameDimensions | null>(null);

  // Public observables
  readonly currentRatio$: Observable<FrameRatioType> = this.currentRatioSubject.asObservable();
  readonly customDimensions$: Observable<FrameDimensions | null> = this.customDimensionsSubject.asObservable();

  /**
   * Get current frame ratio type
   */
  getCurrentRatio(): FrameRatioType {
    return this.currentRatioSubject.value;
  }

  /**
   * Get frame ratio configuration
   */
  getFrameRatio(type: FrameRatioType): FrameRatio {
    return FRAME_RATIOS[type];
  }

  /**
   * Get all available frame ratios
   */
  getAllRatios(): FrameRatio[] {
    return Object.values(FRAME_RATIOS);
  }

  /**
   * Change frame ratio and scale all content
   * Thay đổi tỉ lệ frame và scale toàn bộ nội dung bên trong
   *
   * @param newRatioType - Tỉ lệ mới cần apply
   * @param customDimensions - Dimensions tùy chỉnh (chỉ dùng khi type = 'custom')
   */
  changeFrameRatio(newRatioType: FrameRatioType, customDimensions?: FrameDimensions): void {
    const canvas = this.stateService.getCanvas();
    const frameObject = this.stateService.getFrameObject();

    if (!canvas || !frameObject) {
      console.warn('Canvas or frame not initialized');
      return;
    }

    // Get old frame dimensions (before change)
    const oldFrameDimensions = this.getCurrentFrameDimensions();

    // Get new frame dimensions
    let newFrameDimensions: FrameDimensions;
    if (newRatioType === 'custom' && customDimensions) {
      newFrameDimensions = customDimensions;
      this.customDimensionsSubject.next(customDimensions);
    } else {
      const ratio = FRAME_RATIOS[newRatioType];
      newFrameDimensions = { width: ratio.width, height: ratio.height };
    }

    // Calculate scale ratios
    const scaleX = newFrameDimensions.width / oldFrameDimensions.width;
    const scaleY = newFrameDimensions.height / oldFrameDimensions.height;

    // Store old frame center point
    const oldCenterX = (frameObject.left || 0) + oldFrameDimensions.width / 2;
    const oldCenterY = (frameObject.top || 0) + oldFrameDimensions.height / 2;

    // Update frame dimensions
    frameObject.set({
      width: newFrameDimensions.width,
      height: newFrameDimensions.height,
      scaleX: 1,
      scaleY: 1
    });

    // Calculate new frame position to keep it centered
    const newLeft = oldCenterX - newFrameDimensions.width / 2;
    const newTop = oldCenterY - newFrameDimensions.height / 2;

    frameObject.set({
      left: newLeft,
      top: newTop
    });

    frameObject.setCoords();

    // Scale all objects inside frame proportionally
    this.scaleFrameContent(scaleX, scaleY, oldFrameDimensions, newFrameDimensions);

    // Update state
    this.currentRatioSubject.next(newRatioType);
    this.stateService.updateFrameObject(frameObject);

    // Render canvas
    canvas.requestRenderAll();
  }

  /**
   * Scale all content inside frame proportionally
   * Scale toàn bộ nội dung bên trong frame theo tỉ lệ mới
   *
   * Strategy: Maintain relative position và scale của mỗi object so với frame
   */
  private scaleFrameContent(
    scaleX: number,
    scaleY: number,
    oldFrameDimensions: FrameDimensions,
    newFrameDimensions: FrameDimensions
  ): void {
    const canvas = this.stateService.getCanvas();
    const frameObject = this.stateService.getFrameObject();

    if (!canvas || !frameObject) return;

    const objects = canvas.getObjects();
    const oldFrameLeft = (frameObject.left || 0) + (newFrameDimensions.width - oldFrameDimensions.width) / 2;
    const oldFrameTop = (frameObject.top || 0) + (newFrameDimensions.height - oldFrameDimensions.height) / 2;
    const newFrameLeft = frameObject.left || 0;
    const newFrameTop = frameObject.top || 0;

    objects.forEach((obj: FabricObject) => {
      // Skip frame itself
      if (obj === frameObject) return;

      const metadata = obj.get('customMetadata') as any;
      if (metadata?.type === 'frame') return;

      // Calculate relative position to old frame
      const relativeLeft = (obj.left || 0) - oldFrameLeft;
      const relativeTop = (obj.top || 0) - oldFrameTop;

      // Calculate new position based on scale
      const newLeft = newFrameLeft + relativeLeft * scaleX;
      const newTop = newFrameTop + relativeTop * scaleY;

      // Scale object dimensions
      const currentScaleX = obj.scaleX || 1;
      const currentScaleY = obj.scaleY || 1;
      const newScaleX = currentScaleX * scaleX;
      const newScaleY = currentScaleY * scaleY;

      // Apply new position and scale
      obj.set({
        left: newLeft,
        top: newTop,
        scaleX: newScaleX,
        scaleY: newScaleY
      });

      obj.setCoords();
    });
  }

  /**
   * Get current frame dimensions
   */
  private getCurrentFrameDimensions(): FrameDimensions {
    const frameObject = this.stateService.getFrameObject();

    if (!frameObject) {
      return { width: 300, height: 600 }; // Default 1:2
    }

    return {
      width: (frameObject.width || 0) * (frameObject.scaleX || 1),
      height: (frameObject.height || 0) * (frameObject.scaleY || 1)
    };
  }

  /**
   * Set custom frame dimensions
   * Chỉ dùng khi ratio type là 'custom'
   */
  setCustomDimensions(dimensions: FrameDimensions): void {
    this.changeFrameRatio('custom', dimensions);
  }

  /**
   * Calculate frame ratio from dimensions
   */
  calculateRatioFromDimensions(width: number, height: number): string {
    const gcd = this.greatestCommonDivisor(width, height);
    const ratioWidth = width / gcd;
    const ratioHeight = height / gcd;
    return `${ratioWidth}:${ratioHeight}`;
  }

  /**
   * Greatest Common Divisor (GCD) calculator
   * Dùng để tính tỉ lệ đơn giản nhất
   */
  private greatestCommonDivisor(a: number, b: number): number {
    return b === 0 ? a : this.greatestCommonDivisor(b, a % b);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.currentRatioSubject.complete();
    this.customDimensionsSubject.complete();
  }
}
