import { inject, Injectable } from '@angular/core';
import { FabricObject } from 'fabric';
import { CanvasStateService } from '../canvas/canvas-state.service';

export interface ConstraintResult {
  constrained: boolean;
  needsScaling: boolean;
  needsRepositioning: boolean;
}

/**
 * Object Constraint Service
 *
 * Service đảm bảo các objects luôn nằm trong frame (Figma-style clamping).
 * Sử dụng bounding rect để support rotated objects.
 *
 * Principles:
 * - Objects không thể move, scale, hoặc rotate ra ngoài frame
 * - Sử dụng getBoundingRect() để tính toán chính xác với rotated objects
 * - Clamp position khi object vượt biên
 */
@Injectable()
export class ObjectConstraintService {
  private stateService = inject(CanvasStateService);

  /**
   * Apply frame constraints - Universal method cho move, scale, rotate
   * PREVENTION-BASED: Tính toán position limits để prevent overshoot
   * Không bị jitter vì object không bao giờ vượt bounds
   */
  applyFrameConstraints(obj: FabricObject): ConstraintResult {
    const frameBounds = this.getFrameBounds();
    if (!frameBounds) {
      return { constrained: false, needsScaling: false, needsRepositioning: false };
    }

    // Get object bounding rect (works for rotated objects)
    const boundingRect = obj.getBoundingRect();

    // Frame boundaries
    const frameLeft = frameBounds.left;
    const frameTop = frameBounds.top;
    const frameRight = frameLeft + frameBounds.width;
    const frameBottom = frameTop + frameBounds.height;

    // Calculate offset between object center and bounding rect
    const objLeft = obj.left || 0;
    const objTop = obj.top || 0;
    const offsetX = boundingRect.left - objLeft;
    const offsetY = boundingRect.top - objTop;

    // Calculate min/max allowed positions for object center
    const minLeft = frameLeft - offsetX;
    const maxLeft = frameRight - offsetX - boundingRect.width;
    const minTop = frameTop - offsetY;
    const maxTop = frameBottom - offsetY - boundingRect.height;

    // Clamp object position to stay within bounds
    let newLeft = objLeft;
    let newTop = objTop;
    let needsRepositioning = false;

    // Clamp X
    if (objLeft < minLeft) {
      newLeft = minLeft;
      needsRepositioning = true;
    } else if (objLeft > maxLeft) {
      newLeft = maxLeft;
      needsRepositioning = true;
    }

    // Clamp Y
    if (objTop < minTop) {
      newTop = minTop;
      needsRepositioning = true;
    } else if (objTop > maxTop) {
      newTop = maxTop;
      needsRepositioning = true;
    }

    // Apply clamped position
    if (needsRepositioning) {
      obj.set({
        left: newLeft,
        top: newTop
      });
      obj.setCoords();
    }

    return {
      constrained: needsRepositioning,
      needsScaling: false,
      needsRepositioning
    };
  }

  /**
   * Apply scale constraints - Prevent object from becoming larger than frame
   * PREVENTION-BASED: Clamp scale để object không bao giờ lớn hơn frame
   */
  applyScaleConstraints(obj: FabricObject): ConstraintResult {
    const frameBounds = this.getFrameBounds();
    if (!frameBounds) {
      return { constrained: false, needsScaling: false, needsRepositioning: false };
    }

    // Get bounding rect (includes rotation)
    const boundingRect = obj.getBoundingRect();

    let needsScaling = false;
    let needsRepositioning = false;

    // Check if object is larger than frame
    if (boundingRect.width > frameBounds.width || boundingRect.height > frameBounds.height) {
      // Calculate maximum allowed scale
      const scaleX = frameBounds.width / boundingRect.width;
      const scaleY = frameBounds.height / boundingRect.height;
      const maxScale = Math.min(scaleX, scaleY);

      // Apply scale limit
      obj.set({
        scaleX: (obj.scaleX || 1) * maxScale,
        scaleY: (obj.scaleY || 1) * maxScale
      });
      obj.setCoords();
      needsScaling = true;
    }

    // Apply position constraints to keep within bounds
    const positionResult = this.applyFrameConstraints(obj);

    return {
      constrained: needsScaling || positionResult.constrained,
      needsScaling,
      needsRepositioning: positionResult.needsRepositioning
    };
  }

  /**
   * Constrain object position during creation
   * Đảm bảo object mới tạo nằm trong frame
   */
  getConstrainedCreationPosition(
    width: number,
    height: number,
    preferredLeft: number,
    preferredTop: number
  ): { left: number; top: number } {
    const frameBounds = this.getFrameBounds();
    if (!frameBounds) {
      return { left: preferredLeft, top: preferredTop };
    }

    const frameLeft = frameBounds.left;
    const frameTop = frameBounds.top;
    const frameRight = frameLeft + frameBounds.width;
    const frameBottom = frameTop + frameBounds.height;

    let left = preferredLeft;
    let top = preferredTop;

    // Clamp position to frame boundaries
    left = Math.max(frameLeft, Math.min(left, frameRight - width));
    top = Math.max(frameTop, Math.min(top, frameBottom - height));

    // If object is larger than frame, center it
    if (width > frameBounds.width) {
      left = frameLeft + (frameBounds.width - width) / 2;
    }
    if (height > frameBounds.height) {
      top = frameTop + (frameBounds.height - height) / 2;
    }

    return { left, top };
  }

  /**
   * Handle frame resize - Adjust all objects to stay within new frame
   * Called when frame size or aspect ratio changes
   */
  handleFrameResize(newFrameBounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  }): void {
    const canvas = this.stateService.getCanvas();
    const frame = this.stateService.getFrameObject();
    if (!canvas || !frame) return;

    const objects = canvas.getObjects();

    objects.forEach((obj) => {
      // Skip frame itself
      if (obj === frame) return;

      const boundingRect = obj.getBoundingRect();

      // Check if object needs scaling
      if (boundingRect.width > newFrameBounds.width || boundingRect.height > newFrameBounds.height) {
        const scaleX = newFrameBounds.width / boundingRect.width;
        const scaleY = newFrameBounds.height / boundingRect.height;
        const scaleRatio = Math.min(scaleX, scaleY);

        obj.set({
          scaleX: (obj.scaleX || 1) * scaleRatio,
          scaleY: (obj.scaleY || 1) * scaleRatio
        });
        obj.setCoords();
      }

      // Apply position constraints
      this.applyFrameConstraints(obj);
    });

    canvas.requestRenderAll();
  }

  /**
   * Get frame bounds
   */
  private getFrameBounds(): { left: number; top: number; width: number; height: number } | null {
    const frameObject = this.stateService.getFrameObject();
    if (!frameObject) return null;

    return {
      left: frameObject.left || 0,
      top: frameObject.top || 0,
      width: (frameObject.width || 0) * (frameObject.scaleX || 1),
      height: (frameObject.height || 0) * (frameObject.scaleY || 1)
    };
  }

  /**
   * Check if frame exists
   */
  hasFrame(): boolean {
    return this.stateService.hasFrame();
  }
}
