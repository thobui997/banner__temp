import { Injectable, inject } from '@angular/core';
import { Canvas, Point } from 'fabric';
import { BehaviorSubject, Observable } from 'rxjs';
import { CanvasStateService } from './canvas-state.service';

export interface ZoomState {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  isPanning: boolean;
}

@Injectable()
export class CanvasZoomService {
  private stateService = inject(CanvasStateService);

  private zoomStateSubject = new BehaviorSubject<ZoomState>({
    zoom: 1,
    minZoom: 0.1,
    maxZoom: 5,
    isPanning: false
  });

  readonly zoomState$: Observable<ZoomState> = this.zoomStateSubject.asObservable();

  private readonly ZOOM_STEP = 0.1;
  private isDragging = false;
  private lastPosX = 0;
  private lastPosY = 0;

  /**
   * Initialize zoom functionality
   */
  initializeZoom(canvas: Canvas): void {
    this.setupMouseWheelZoom(canvas);
    this.setupPanning(canvas);
    this.setupSpaceKeyPanning(canvas);
  }

  /**
   * Setup mouse wheel zoom (zoom to cursor position)
   */
  private setupMouseWheelZoom(canvas: Canvas): void {
    canvas.on('mouse:wheel', (opt) => {
      const event = opt.e as WheelEvent;
      event.preventDefault();
      event.stopPropagation();

      const delta = event.deltaY;
      let zoom = canvas.getZoom();

      // Calculate zoom factor
      zoom *= 0.999 ** delta;

      const state = this.zoomStateSubject.value;

      // Clamp zoom to min/max
      if (zoom > state.maxZoom) zoom = state.maxZoom;
      if (zoom < state.minZoom) zoom = state.minZoom;

      // Zoom to cursor position
      const point = new Point(event.offsetX, event.offsetY);
      canvas.zoomToPoint(point, zoom);

      // Update zoom state
      this.updateZoomState({ zoom });

      canvas.requestRenderAll();
    });
  }

  /**
   * Setup panning with middle mouse button or space + left click
   */
  private setupPanning(canvas: Canvas): void {
    canvas.on('mouse:down', (opt) => {
      const event = opt.e as MouseEvent;

      // Check if middle mouse button or space + left mouse button
      const state = this.zoomStateSubject.value;
      if (event.button === 1 || (state.isPanning && event.button === 0)) {
        this.isDragging = true;
        canvas.selection = false;
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';

        this.lastPosX = event.clientX;
        this.lastPosY = event.clientY;

        // Prevent default object selection
        canvas.forEachObject((obj) => {
          obj.selectable = false;
        });
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (this.isDragging) {
        const event = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform;

        if (vpt) {
          vpt[4] += event.clientX - this.lastPosX;
          vpt[5] += event.clientY - this.lastPosY;
          canvas.requestRenderAll();
        }

        this.lastPosX = event.clientX;
        this.lastPosY = event.clientY;
      }
    });

    canvas.on('mouse:up', () => {
      if (this.isDragging) {
        this.isDragging = false;
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';

        // Re-enable object selection
        canvas.forEachObject((obj) => {
          obj.selectable = true;
        });

        canvas.requestRenderAll();
      }
    });
  }

  /**
   * Setup space key for temporary panning mode
   */
  private setupSpaceKeyPanning(canvas: Canvas): void {
    let isSpacePressed = false;

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && !isSpacePressed) {
        isSpacePressed = true;
        event.preventDefault();

        this.updateZoomState({ isPanning: true });
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';

        // Disable object selection while panning
        canvas.selection = false;
      }
    });

    document.addEventListener('keyup', (event) => {
      if (event.code === 'Space') {
        isSpacePressed = false;

        this.updateZoomState({ isPanning: false });
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';

        // Re-enable selection
        canvas.selection = true;

        // Reset dragging state if space is released during drag
        if (this.isDragging) {
          this.isDragging = false;
          canvas.forEachObject((obj) => {
            obj.selectable = true;
          });
        }
      }
    });
  }

  /**
   * Zoom in by step
   */
  zoomIn(): void {
    const canvas = this.stateService.getCanvas();
    const state = this.zoomStateSubject.value;

    let newZoom = state.zoom + this.ZOOM_STEP;
    if (newZoom > state.maxZoom) newZoom = state.maxZoom;

    // Zoom to canvas center
    const center = canvas.getCenter();
    canvas.zoomToPoint(new Point(center.left, center.top), newZoom);

    this.updateZoomState({ zoom: newZoom });
    canvas.requestRenderAll();
  }

  /**
   * Zoom out by step
   */
  zoomOut(): void {
    const canvas = this.stateService.getCanvas();
    const state = this.zoomStateSubject.value;

    let newZoom = state.zoom - this.ZOOM_STEP;
    if (newZoom < state.minZoom) newZoom = state.minZoom;

    // Zoom to canvas center
    const center = canvas.getCenter();
    canvas.zoomToPoint(new Point(center.left, center.top), newZoom);

    this.updateZoomState({ zoom: newZoom });
    canvas.requestRenderAll();
  }

  /**
   * Reset zoom to 100%
   */
  resetZoom(): void {
    const canvas = this.stateService.getCanvas();

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.setZoom(1);

    this.updateZoomState({ zoom: 1 });
    canvas.requestRenderAll();
  }

  /**
   * Zoom to fit all objects
   */
  zoomToFit(): void {
    const canvas = this.stateService.getCanvas();
    const frame = this.stateService.getFrameObject();

    if (!frame) {
      this.resetZoom();
      return;
    }

    const frameBounds = frame.getBoundingRect();
    const canvasWidth = canvas.width || 800;
    const canvasHeight = canvas.height || 600;

    // Calculate zoom to fit frame in canvas with padding
    const padding = 50;
    const zoomX = (canvasWidth - padding * 2) / frameBounds.width;
    const zoomY = (canvasHeight - padding * 2) / frameBounds.height;
    const zoom = Math.min(zoomX, zoomY);

    const state = this.zoomStateSubject.value;
    const clampedZoom = Math.max(state.minZoom, Math.min(state.maxZoom, zoom));

    // Center the frame
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const frameCenterX = frameBounds.left + frameBounds.width / 2;
    const frameCenterY = frameBounds.top + frameBounds.height / 2;

    canvas.setZoom(clampedZoom);

    const vpt = canvas.viewportTransform;
    if (vpt) {
      vpt[4] = centerX - frameCenterX * clampedZoom;
      vpt[5] = centerY - frameCenterY * clampedZoom;
    }

    this.updateZoomState({ zoom: clampedZoom });
    canvas.requestRenderAll();
  }

  /**
   * Set specific zoom level
   */
  setZoom(zoom: number): void {
    const canvas = this.stateService.getCanvas();
    const state = this.zoomStateSubject.value;

    // Clamp zoom
    const clampedZoom = Math.max(state.minZoom, Math.min(state.maxZoom, zoom));

    // Zoom to center
    const center = canvas.getCenterPoint();
    canvas.zoomToPoint(new Point(center.x, center.y), clampedZoom);

    this.updateZoomState({ zoom: clampedZoom });
    canvas.requestRenderAll();
  }

  /**
   * Get current zoom level
   */
  getCurrentZoom(): number {
    return this.zoomStateSubject.value.zoom;
  }

  /**
   * Get current zoom percentage
   */
  getZoomPercentage(): number {
    return Math.round(this.zoomStateSubject.value.zoom * 100);
  }

  /**
   * Update zoom state
   */
  private updateZoomState(partial: Partial<ZoomState>): void {
    this.zoomStateSubject.next({
      ...this.zoomStateSubject.value,
      ...partial
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.zoomStateSubject.complete();
  }
}
