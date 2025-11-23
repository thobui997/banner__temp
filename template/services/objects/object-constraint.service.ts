import { inject, Injectable } from '@angular/core';
import { FabricObject } from 'fabric';
import { CanvasStateService } from '../canvas/canvas-state.service';

export interface ConstraintResult {
  constrained: boolean;
  needsScaling: boolean;
  needsRepositioning: boolean;
}

@Injectable()
export class ObjectConstraintService {
  private stateService = inject(CanvasStateService);

  /**
   * Apply frame constraints to an object
   * This ensures the object stays within frame boundaries
   * Enhanced to handle rotation (bounding rect approach)
   */
  applyFrameConstraints(obj: FabricObject): ConstraintResult {
    const frame = this.stateService.getFrameObject();
    if (!frame) return { constrained: false, needsScaling: false, needsRepositioning: false };

    const frameBounds = this.getFrameBounds();
    if (!frameBounds) return { constrained: false, needsScaling: false, needsRepositioning: false };

    // Get object bounding rect (accounting for rotation)
    const objBoundingRect = obj.getBoundingRect();

    // Frame boundaries
    const frameLeft = frameBounds.left;
    const frameTop = frameBounds.top;
    const frameRight = frameLeft + frameBounds.width;
    const frameBottom = frameTop + frameBounds.height;

    let needsRepositioning = false;
    let left = obj.left || 0;
    let top = obj.top || 0;

    // Check if object bounding rect exceeds frame boundaries
    // and calculate adjustment needed

    // Left edge constraint
    if (objBoundingRect.left < frameLeft) {
      const adjustment = frameLeft - objBoundingRect.left;
      left += adjustment;
      needsRepositioning = true;
    }

    // Right edge constraint
    if (objBoundingRect.left + objBoundingRect.width > frameRight) {
      const adjustment = (objBoundingRect.left + objBoundingRect.width) - frameRight;
      left -= adjustment;
      needsRepositioning = true;
    }

    // Top edge constraint
    if (objBoundingRect.top < frameTop) {
      const adjustment = frameTop - objBoundingRect.top;
      top += adjustment;
      needsRepositioning = true;
    }

    // Bottom edge constraint
    if (objBoundingRect.top + objBoundingRect.height > frameBottom) {
      const adjustment = (objBoundingRect.top + objBoundingRect.height) - frameBottom;
      top -= adjustment;
      needsRepositioning = true;
    }

    // Apply constrained position
    if (needsRepositioning) {
      obj.set({ left, top });
      obj.setCoords();
    }

    return {
      constrained: needsRepositioning,
      needsScaling: false,
      needsRepositioning
    };
  }

  /**
   * Apply rotation constraints (Figma-style clamping)
   * Ensures object bounding box stays within frame during rotation
   *
   * This is called during object:rotating event
   */
  applyRotationConstraints(obj: FabricObject): ConstraintResult {
    const frame = this.stateService.getFrameObject();
    if (!frame) return { constrained: false, needsScaling: false, needsRepositioning: false };

    const frameBounds = this.getFrameBounds();
    if (!frameBounds) return { constrained: false, needsScaling: false, needsRepositioning: false };

    // Get object bounding rect after rotation
    const objBoundingRect = obj.getBoundingRect();

    // Frame boundaries
    const frameLeft = frameBounds.left;
    const frameTop = frameBounds.top;
    const frameRight = frameLeft + frameBounds.width;
    const frameBottom = frameTop + frameBounds.height;

    // Check if bounding rect exceeds frame boundaries
    const exceedsLeft = objBoundingRect.left < frameLeft;
    const exceedsRight = objBoundingRect.left + objBoundingRect.width > frameRight;
    const exceedsTop = objBoundingRect.top < frameTop;
    const exceedsBottom = objBoundingRect.top + objBoundingRect.height > frameBottom;

    // If object exceeds any boundary, clamp position
    if (exceedsLeft || exceedsRight || exceedsTop || exceedsBottom) {
      let left = obj.left || 0;
      let top = obj.top || 0;

      // Calculate center of object
      const objCenterX = objBoundingRect.left + objBoundingRect.width / 2;
      const objCenterY = objBoundingRect.top + objBoundingRect.height / 2;

      // Clamp center to frame boundaries (with padding)
      const padding = Math.max(objBoundingRect.width, objBoundingRect.height) / 2;
      const clampedCenterX = Math.max(
        frameLeft + padding,
        Math.min(frameRight - padding, objCenterX)
      );
      const clampedCenterY = Math.max(
        frameTop + padding,
        Math.min(frameBottom - padding, objCenterY)
      );

      // Calculate adjustment needed
      const adjustX = clampedCenterX - objCenterX;
      const adjustY = clampedCenterY - objCenterY;

      obj.set({
        left: left + adjustX,
        top: top + adjustY
      });

      obj.setCoords();

      return {
        constrained: true,
        needsScaling: false,
        needsRepositioning: true
      };
    }

    return { constrained: false, needsScaling: false, needsRepositioning: false };
  }

  /**
   * Apply scale constraints to prevent object from exceeding frame boundaries
   * This is called during scaling operations
   */
  applyScaleConstraints(obj: FabricObject): ConstraintResult {
    const frame = this.stateService.getFrameObject();
    if (!frame) return { constrained: false, needsScaling: false, needsRepositioning: false };

    const frameBounds = this.getFrameBounds();
    if (!frameBounds) return { constrained: false, needsScaling: false, needsRepositioning: false };

    // Get object dimensions
    const objWidth = (obj.width || 0) * (obj.scaleX || 1);
    const objHeight = (obj.height || 0) * (obj.scaleY || 1);
    const objLeft = obj.left || 0;
    const objTop = obj.top || 0;

    // Frame boundaries
    const frameLeft = frameBounds.left;
    const frameTop = frameBounds.top;
    const frameRight = frameLeft + frameBounds.width;
    const frameBottom = frameTop + frameBounds.height;

    // Calculate max allowed dimensions based on current position
    const maxWidth = frameRight - objLeft;
    const maxHeight = frameBottom - objTop;

    // Limit scale if object exceeds frame boundaries
    let newScaleX = obj.scaleX || 1;
    let newScaleY = obj.scaleY || 1;
    let needsScaling = false;

    // Check if object is too wide
    if (objWidth > maxWidth) {
      newScaleX = maxWidth / (obj.width || 1);
      needsScaling = true;
    }

    // Check if object is too tall
    if (objHeight > maxHeight) {
      newScaleY = maxHeight / (obj.height || 1);
      needsScaling = true;
    }

    // Check if object exceeds left boundary
    if (objLeft < frameLeft) {
      const availableWidth = frameRight - frameLeft;
      newScaleX = Math.min(newScaleX, availableWidth / (obj.width || 1));
      needsScaling = true;
    }

    // Check if object exceeds top boundary
    if (objTop < frameTop) {
      const availableHeight = frameBottom - frameTop;
      newScaleY = Math.min(newScaleY, availableHeight / (obj.height || 1));
      needsScaling = true;
    }

    // Apply constrained scale
    if (needsScaling) {
      obj.set({ scaleX: newScaleX, scaleY: newScaleY });
      obj.setCoords();

      // After scaling, ensure position is still valid
      const positionResult = this.applyFrameConstraints(obj);
      return {
        constrained: true,
        needsScaling: true,
        needsRepositioning: positionResult.needsRepositioning
      };
    }

    return { constrained: false, needsScaling: false, needsRepositioning: false };
  }

  /**
   * Handle frame resize - adjust all objects to fit within new frame bounds
   * This is the key method for your use case
   */
  handleFrameResize(newFrameBounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  }): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const objects = canvas.getObjects();
    const frame = this.stateService.getFrameObject();

    objects.forEach((obj) => {
      // Skip the frame itself
      if (obj === frame) return;

      // Get object dimensions
      const objWidth = (obj.width || 0) * (obj.scaleX || 1);
      const objHeight = (obj.height || 0) * (obj.scaleY || 1);
      const objLeft = obj.left || 0;
      const objTop = obj.top || 0;

      // Frame boundaries
      const frameLeft = newFrameBounds.left;
      const frameTop = newFrameBounds.top;
      const frameRight = frameLeft + newFrameBounds.width;
      const frameBottom = frameTop + newFrameBounds.height;

      let needsUpdate = false;
      let newScaleX = obj.scaleX || 1;
      let newScaleY = obj.scaleY || 1;
      let newLeft = objLeft;
      let newTop = objTop;

      // Step 1: Check if object is now too large for frame
      if (objWidth > newFrameBounds.width || objHeight > newFrameBounds.height) {
        // Calculate scale to fit within frame while maintaining aspect ratio
        const scaleRatioX = newFrameBounds.width / objWidth;
        const scaleRatioY = newFrameBounds.height / objHeight;
        const scaleRatio = Math.min(scaleRatioX, scaleRatioY);

        newScaleX = (obj.scaleX || 1) * scaleRatio;
        newScaleY = (obj.scaleY || 1) * scaleRatio;
        needsUpdate = true;
      }

      // Step 2: Check if object position is outside frame boundaries
      const finalObjWidth = (obj.width || 0) * newScaleX;
      const finalObjHeight = (obj.height || 0) * newScaleY;

      // Check left boundary
      if (newLeft < frameLeft) {
        newLeft = frameLeft;
        needsUpdate = true;
      }

      // Check right boundary
      if (newLeft + finalObjWidth > frameRight) {
        newLeft = Math.max(frameLeft, frameRight - finalObjWidth);
        needsUpdate = true;
      }

      // Check top boundary
      if (newTop < frameTop) {
        newTop = frameTop;
        needsUpdate = true;
      }

      // Check bottom boundary
      if (newTop + finalObjHeight > frameBottom) {
        newTop = Math.max(frameTop, frameBottom - finalObjHeight);
        needsUpdate = true;
      }

      // Apply updates if needed
      if (needsUpdate) {
        obj.set({
          scaleX: newScaleX,
          scaleY: newScaleY,
          left: newLeft,
          top: newTop
        });
        obj.setCoords();
      }
    });

    canvas.renderAll();
  }

  /**
   * Smart frame resize - provides different strategies
   */
  handleFrameResizeWithStrategy(
    newFrameBounds: { left: number; top: number; width: number; height: number },
    strategy: 'scale' | 'reposition' | 'scale-and-reposition' = 'scale-and-reposition'
  ): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const objects = canvas.getObjects();
    const frame = this.stateService.getFrameObject();

    objects.forEach((obj) => {
      // Skip the frame itself
      if (obj === frame) return;

      switch (strategy) {
        case 'scale':
          this.scaleObjectToFitFrame(obj, newFrameBounds);
          break;

        case 'reposition':
          this.repositionObjectInFrame(obj, newFrameBounds);
          break;

        case 'scale-and-reposition':
        default:
          this.scaleAndRepositionObject(obj, newFrameBounds);
          break;
      }
    });

    canvas.renderAll();
  }

  /**
   * Scale object to fit within frame (used when frame gets smaller)
   */
  private scaleObjectToFitFrame(
    obj: FabricObject,
    frameBounds: { left: number; top: number; width: number; height: number }
  ): void {
    const objWidth = (obj.width || 0) * (obj.scaleX || 1);
    const objHeight = (obj.height || 0) * (obj.scaleY || 1);

    // Only scale down if object is larger than frame
    if (objWidth > frameBounds.width || objHeight > frameBounds.height) {
      const scaleRatioX = frameBounds.width / objWidth;
      const scaleRatioY = frameBounds.height / objHeight;
      const scaleRatio = Math.min(scaleRatioX, scaleRatioY, 1); // Never scale up

      obj.set({
        scaleX: (obj.scaleX || 1) * scaleRatio,
        scaleY: (obj.scaleY || 1) * scaleRatio
      });
      obj.setCoords();
    }
  }

  /**
   * Reposition object to stay within frame boundaries
   */
  private repositionObjectInFrame(
    obj: FabricObject,
    frameBounds: { left: number; top: number; width: number; height: number }
  ): void {
    const objWidth = (obj.width || 0) * (obj.scaleX || 1);
    const objHeight = (obj.height || 0) * (obj.scaleY || 1);
    let objLeft = obj.left || 0;
    let objTop = obj.top || 0;

    const frameLeft = frameBounds.left;
    const frameTop = frameBounds.top;
    const frameRight = frameLeft + frameBounds.width;
    const frameBottom = frameTop + frameBounds.height;

    // Constrain position
    objLeft = Math.max(frameLeft, Math.min(objLeft, frameRight - objWidth));
    objTop = Math.max(frameTop, Math.min(objTop, frameBottom - objHeight));

    obj.set({ left: objLeft, top: objTop });
    obj.setCoords();
  }

  /**
   * Combined approach: scale if too large, then reposition
   */
  private scaleAndRepositionObject(
    obj: FabricObject,
    frameBounds: { left: number; top: number; width: number; height: number }
  ): void {
    // First, scale down if needed
    this.scaleObjectToFitFrame(obj, frameBounds);

    // Then, reposition to stay within bounds
    this.repositionObjectInFrame(obj, frameBounds);
  }

  /**
   * Check if object can be placed at given position within frame
   */
  isPositionValid(left: number, top: number, width: number, height: number): boolean {
    const frameBounds = this.getFrameBounds();
    if (!frameBounds) return true; // No frame, no constraint

    const frameLeft = frameBounds.left;
    const frameTop = frameBounds.top;
    const frameRight = frameLeft + frameBounds.width;
    const frameBottom = frameTop + frameBounds.height;

    // Check if object fits within frame
    return (
      left >= frameLeft &&
      top >= frameTop &&
      left + width <= frameRight &&
      top + height <= frameBottom
    );
  }

  /**
   * Constrain object to frame during creation
   * Returns adjusted position that ensures object is within frame
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

    // Ensure object fits within frame horizontally
    if (left < frameLeft) {
      left = frameLeft;
    }
    if (left + width > frameRight) {
      left = frameRight - width;
    }

    // Ensure object fits within frame vertically
    if (top < frameTop) {
      top = frameTop;
    }
    if (top + height > frameBottom) {
      top = frameBottom - height;
    }

    // If object is too large for frame, center it
    if (width > frameBounds.width) {
      left = frameLeft + (frameBounds.width - width) / 2;
    }
    if (height > frameBounds.height) {
      top = frameTop + (frameBounds.height - height) / 2;
    }

    return { left, top };
  }

  /**
   * Get frame bounds helper
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
