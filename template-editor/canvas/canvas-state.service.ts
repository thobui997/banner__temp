import { Injectable } from '@angular/core';
import { Canvas, FabricObject } from 'fabric';
import { BehaviorSubject, Observable } from 'rxjs';
import { CanvasObjectProperties } from '../../../types';

@Injectable()
export class CanvasStateService {
  private canvas!: Canvas;

  // Private BehaviorSubjects
  private selectedObjectSubject = new BehaviorSubject<FabricObject | null>(null);
  private selectedObjectPropertiesSubject = new BehaviorSubject<CanvasObjectProperties | null>(
    null
  );
  private frameObjectSubject = new BehaviorSubject<FabricObject | null>(null);

  // Public Observables
  readonly selectedObject$: Observable<FabricObject | null> =
    this.selectedObjectSubject.asObservable();
  readonly selectedObjectProperties$: Observable<CanvasObjectProperties | null> =
    this.selectedObjectPropertiesSubject.asObservable();
  readonly frameObject$: Observable<FabricObject | null> = this.frameObjectSubject.asObservable();

  setCanvas(canvas: Canvas): void {
    this.canvas = canvas;
  }

  getCanvas(): Canvas {
    return this.canvas;
  }

  updateSelectedObject(object: FabricObject | null): void {
    this.selectedObjectSubject.next(object);
  }

  updateSelectedObjectProperties(properties: CanvasObjectProperties | null): void {
    this.selectedObjectPropertiesSubject.next(properties);
  }

  updateFrameObject(frame: FabricObject | null): void {
    this.frameObjectSubject.next(frame);
  }

  getFrameObject(): FabricObject | null {
    return this.frameObjectSubject.value;
  }

  hasFrame(): boolean {
    return this.frameObjectSubject.value !== null;
  }

  getCanvasDimensions(): { width: number; height: number } {
    return {
      width: this.canvas.width || 0,
      height: this.canvas.height || 0
    };
  }

  getFrameBounds(): { left: number; top: number; width: number; height: number } | null {
    const frameObject = this.getFrameObject();

    if (!frameObject) {
      return null;
    }

    return {
      left: frameObject.left || 0,
      top: frameObject.top || 0,
      width: frameObject.width ? frameObject.width * frameObject.scaleX : 0,
      height: frameObject.height ? frameObject.height * frameObject.scaleY : 0
    };
  }

  // Optional: Cleanup method
  destroy(): void {
    this.selectedObjectSubject.complete();
    this.selectedObjectPropertiesSubject.complete();
    this.frameObjectSubject.complete();
  }

  maintainViewportOnResize(newWidth: number, newHeight: number): void {
    if (!this.canvas) return;

    const oldWidth = this.canvas.width || 0;
    const oldHeight = this.canvas.height || 0;

    // Get current viewport transform
    const vpt = this.canvas.viewportTransform;
    if (!vpt) return;

    // Calculate center point before resize
    const centerX = (oldWidth / 2 - vpt[4]) / vpt[0];
    const centerY = (oldHeight / 2 - vpt[5]) / vpt[3];

    // Update canvas dimensions
    this.canvas.setDimensions({
      width: newWidth,
      height: newHeight
    });

    // Recalculate viewport transform to maintain center point
    vpt[4] = newWidth / 2 - centerX * vpt[0];
    vpt[5] = newHeight / 2 - centerY * vpt[3];

    this.canvas.setViewportTransform(vpt);
    this.canvas.requestRenderAll();
  }
}
