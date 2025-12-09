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

    // Calculate and store initial aspect ratio
    const aspectRatio = width / height;

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
      lockMovementX: false,
      lockMovementY: false
    });

    frame.set('customMetadata', {
      id: 'frame-main',
      createdAt: Date.now(),
      type: 'frame',
      isMainFrame: true,
      aspectRatio: aspectRatio,
      customName: 'Background'
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
   * Update aspect ratio in metadata
   */
  updateAspectRatio(frame: FabricObject, aspectRatio: number): void {
    const metadata = frame.get('customMetadata') as any;
    if (metadata) {
      metadata.aspectRatio = aspectRatio;
      frame.set('customMetadata', metadata);
    }
  }

  /**
   * Get stored aspect ratio
   */
  getAspectRatio(frame: FabricObject): number | null {
    const metadata = frame.get('customMetadata') as any;
    return metadata?.aspectRatio || null;
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
    const canvas = this.stateService.getCanvas();

    if (!frameBounds) {
      // No frame, use canvas center with viewport transform
      const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
      const zoom = canvas.getZoom();

      const canvasWidth = canvas.width || 0;
      const canvasHeight = canvas.height || 0;

      // Convert viewport center to canvas coordinates
      const canvasCenterX = (canvasWidth / 2 - vpt[4]) / zoom;
      const canvasCenterY = (canvasHeight / 2 - vpt[5]) / zoom;

      return {
        left: preferredLeft ?? canvasCenterX - width / 2,
        top: preferredTop ?? canvasCenterY - height / 2
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

  enforceAspectRatio(frame: FabricObject) {
    const metadata = frame.get('customMetadata') as any;
    const targetAspectRatio = metadata?.aspectRatio;
    if (!targetAspectRatio) return;

    let newW = (frame.width || 0) * (frame.scaleX || 1);
    let newH = (frame.height || 0) * (frame.scaleY || 1);

    const currentAspect = newW / newH;

    if (Math.abs(currentAspect - targetAspectRatio) > 0.0001) {
      if (Math.abs(frame.scaleX - 1) > Math.abs(frame.scaleY - 1)) {
        newH = newW / targetAspectRatio;
      } else {
        newW = newH * targetAspectRatio;
      }
    }

    frame.set({
      width: newW,
      height: newH,
      scaleX: 1,
      scaleY: 1
    });

    frame.set('dirty', true);
  }
}
