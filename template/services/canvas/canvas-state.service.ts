import { Injectable } from '@angular/core';
import { Canvas, FabricObject } from 'fabric';
import { BehaviorSubject, Observable } from 'rxjs';
import { Layer } from '../../types/layer.type';
import { CanvasObjectProperties } from '../../types/canvas-object.type';

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

  // Optional: Cleanup method
  destroy(): void {
    this.selectedObjectSubject.complete();
    this.selectedObjectPropertiesSubject.complete();
    this.frameObjectSubject.complete();
  }
}
