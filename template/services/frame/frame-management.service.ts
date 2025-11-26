// template/services/frame/frame-management.service.ts
import { inject, Injectable } from '@angular/core';
import { FabricObject, Rect } from 'fabric';
import { BehaviorSubject, Observable } from 'rxjs';
import { CanvasStateService } from '../canvas/canvas-state.service';

export interface FrameBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

@Injectable()
export class FrameManagementService {
  private stateService = inject(CanvasStateService);

  private frameBoundsSubject = new BehaviorSubject<FrameBounds | null>(null);
  readonly frameBounds$: Observable<FrameBounds | null> = this.frameBoundsSubject.asObservable();

  initializeFrame(width: number, height: number): Rect {
    const canvas = this.stateService.getCanvas();
    const canvasWidth = canvas.width || 0;
    const canvasHeight = canvas.height || 0;

    const left = (canvasWidth - width) / 2;
    const top = (canvasHeight - height) / 2;

    const frame = new Rect({
      left,
      top,
      width,
      height,
      fill: '#FFFFFF',
      stroke: '#E5E7EB',
      strokeWidth: 1,
      selectable: true,
      hasControls: true,
      lockRotation: true,
      lockScalingFlip: true,
      hasBorders: true,
      borderColor: '#3B82F6',
      cornerColor: '#3B82F6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8,
      // Prevent moving outside canvas
      lockMovementX: false,
      lockMovementY: false
    });

    frame.set('customMetadata', {
      id: 'frame-main',
      createdAt: Date.now(),
      type: 'frame',
      isMainFrame: true
    });

    this.stateService.updateFrameObject(frame);
    this.updateFrameBounds(frame);

    return frame;
  }

  /**
   * Update frame bounds when frame is resized or moved
   */
  updateFrameBounds(frame: FabricObject): void {
    const bounds: FrameBounds = {
      left: frame.left || 0,
      top: frame.top || 0,
      width: (frame.width || 0) * (frame.scaleX || 1),
      height: (frame.height || 0) * (frame.scaleY || 1)
    };

    this.frameBoundsSubject.next(bounds);
  }

  /**
   * Get current frame bounds
   */
  getFrameBounds(): FrameBounds | null {
    return this.frameBoundsSubject.value;
  }

  /**
   * Check if frame exists
   */
  hasFrame(): boolean {
    return this.stateService.hasFrame();
  }

  /**
   * Apply clipping to object based on frame bounds
   */
  applyFrameClipping(obj: FabricObject): void {
    const frame = this.stateService.getFrameObject();
    if (!frame) return;

    const frameBounds = this.getFrameBounds();
    if (!frameBounds) return;

    // Create clipping rectangle based on frame position and size
    const clipRect = new Rect({
      left: frameBounds.left,
      top: frameBounds.top,
      width: frameBounds.width,
      height: frameBounds.height,
      absolutePositioned: true,
      fill: 'transparent',
      stroke: 'transparent'
    });

    obj.set('clipPath', clipRect);
  }

  /**
   * Remove clipping from object
   */
  removeFrameClipping(obj: FabricObject): void {
    obj.set('clipPath', undefined);
  }

  /**
   * Apply clipping to all objects in canvas
   */
  applyClippingToAllObjects(): void {
    const canvas = this.stateService.getCanvas();
    const frame = this.stateService.getFrameObject();

    if (!canvas || !frame) return;

    canvas.getObjects().forEach((obj) => {
      if (obj !== frame) {
        this.applyFrameClipping(obj);
      }
    });

    canvas.requestRenderAll();
  }

  /**
   * Check if object is completely within frame
   */
  isObjectWithinFrame(obj: FabricObject): boolean {
    const frameBounds = this.getFrameBounds();
    if (!frameBounds) return true;

    const objBounds = obj.getBoundingRect();

    return (
      objBounds.left >= frameBounds.left &&
      objBounds.top >= frameBounds.top &&
      objBounds.left + objBounds.width <= frameBounds.left + frameBounds.width &&
      objBounds.top + objBounds.height <= frameBounds.top + frameBounds.height
    );
  }

  /**
   * Constrain object creation position within frame
   */
  getConstrainedPosition(
    width: number,
    height: number,
    preferredLeft?: number,
    preferredTop?: number
  ): { left: number; top: number } {
    const frameBounds = this.getFrameBounds();

    if (!frameBounds) {
      return {
        left: preferredLeft || 100,
        top: preferredTop || 100
      };
    }

    // Default to center of frame
    let left = preferredLeft ?? frameBounds.left + (frameBounds.width - width) / 2;
    let top = preferredTop ?? frameBounds.top + (frameBounds.height - height) / 2;

    // Ensure object stays within frame bounds
    left = Math.max(frameBounds.left, Math.min(left, frameBounds.left + frameBounds.width - width));
    top = Math.max(frameBounds.top, Math.min(top, frameBounds.top + frameBounds.height - height));

    return { left, top };
  }

  /**
   * Resize frame and update all object clipping
   */
  resizeFrame(newWidth: number, newHeight: number): void {
    const frame = this.stateService.getFrameObject();
    if (!frame) return;

    const canvas = this.stateService.getCanvas();

    // Store old bounds for comparison
    const oldBounds = this.getFrameBounds();

    // Update frame dimensions
    frame.set({
      scaleX: 1,
      scaleY: 1
    });

    (frame as Rect).set({
      width: newWidth,
      height: newHeight
    });

    frame.setCoords();

    // Update bounds
    this.updateFrameBounds(frame);

    // Reapply clipping to all objects with new frame bounds
    this.applyClippingToAllObjects();

    // Optional: Adjust objects that are now outside frame
    if (oldBounds) {
      this.handleFrameResize(oldBounds);
    }

    canvas.requestRenderAll();
  }

  /**
   * Handle frame resize - optionally adjust objects
   */
  private handleFrameResize(oldBounds: FrameBounds): void {
    const canvas = this.stateService.getCanvas();
    const frame = this.stateService.getFrameObject();
    const newBounds = this.getFrameBounds();

    if (!newBounds) return;

    canvas.getObjects().forEach((obj) => {
      if (obj === frame) return;

      const objBounds = obj.getBoundingRect();

      // Check if object is now outside frame
      const isOutside =
        objBounds.left < newBounds.left ||
        objBounds.top < newBounds.top ||
        objBounds.left + objBounds.width > newBounds.left + newBounds.width ||
        objBounds.top + objBounds.height > newBounds.top + newBounds.height;

      if (isOutside) {
        // Option 1: Just let clipping handle it (objects stay where they are)
        // Option 2: Scale down objects that are too large
        // Option 3: Reposition objects to fit within frame

        // Implementing Option 3 here:
        this.repositionObjectToFitFrame(obj, newBounds);
      }
    });
  }

  /**
   * Reposition object to fit within frame bounds
   */
  private repositionObjectToFitFrame(obj: FabricObject, frameBounds: FrameBounds): void {
    const objBounds = obj.getBoundingRect();
    let left = obj.left || 0;
    let top = obj.top || 0;
    let needsUpdate = false;

    // Check and adjust horizontal position
    if (objBounds.left < frameBounds.left) {
      left += frameBounds.left - objBounds.left;
      needsUpdate = true;
    } else if (objBounds.left + objBounds.width > frameBounds.left + frameBounds.width) {
      left -= objBounds.left + objBounds.width - (frameBounds.left + frameBounds.width);
      needsUpdate = true;
    }

    // Check and adjust vertical position
    if (objBounds.top < frameBounds.top) {
      top += frameBounds.top - objBounds.top;
      needsUpdate = true;
    } else if (objBounds.top + objBounds.height > frameBounds.top + frameBounds.height) {
      top -= objBounds.top + objBounds.height - (frameBounds.top + frameBounds.height);
      needsUpdate = true;
    }

    if (needsUpdate) {
      obj.set({ left, top });
      obj.setCoords();
    }
  }
}
