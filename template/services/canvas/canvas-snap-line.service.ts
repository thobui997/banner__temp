import { Injectable, inject } from '@angular/core';
import { FabricObject, Line } from 'fabric';
import { CanvasStateService } from './canvas-state.service';

export interface SnapPoint {
  value: number;
  type: 'vertical' | 'horizontal';
  source: 'object' | 'frame' | 'center';
}

export interface SnapResult {
  snapped: boolean;
  snapLines: Line[];
  snapPosition: { left?: number; top?: number };
}

@Injectable()
export class SnapLineService {
  private stateService = inject(CanvasStateService);

  private readonly SNAP_THRESHOLD = 5;
  private readonly LINE_COLOR = '#FF00FF';
  private readonly LINE_STROKE_WIDTH = 1;
  private readonly LINE_EXTENSION = 20; 

  private activeSnapLines: Line[] = [];

  /**
   * Calculate snap points for an object during movement
   */
  calculateSnap(movingObject: FabricObject, left: number, top: number): SnapResult {
    const canvas = this.stateService.getCanvas();
    const frame = this.stateService.getFrameObject();

    if (!canvas) {
      return { snapped: false, snapLines: [], snapPosition: {} };
    }

    // Get all snap points from other objects and frame
    const snapPoints = this.collectSnapPoints(movingObject);

    // Get moving object bounds
    const objWidth = (movingObject.width || 0) * (movingObject.scaleX || 1);
    const objHeight = (movingObject.height || 0) * (movingObject.scaleY || 1);

    // Calculate edges and center of moving object
    const objLeft = left;
    const objRight = left + objWidth;
    const objCenterX = left + objWidth / 2;
    const objTop = top;
    const objBottom = top + objHeight;
    const objCenterY = top + objHeight / 2;

    let snappedLeft = left;
    let snappedTop = top;
    const newSnapLines: Line[] = [];
    let snapped = false;

    // Determine snap line display area based on frame
    // If frame exists, snap lines extend across frame bounds with some extension
    // If no frame, use entire canvas
    let snapLineMinY = 0;
    let snapLineMaxY = canvas.height || 0;
    let snapLineMinX = 0;
    let snapLineMaxX = canvas.width || 0;

    if (frame) {
      const frameBounds = frame.getBoundingRect();
      // Extend snap lines slightly beyond frame for better visibility
      snapLineMinY = Math.max(0, frameBounds.top - this.LINE_EXTENSION);
      snapLineMaxY = Math.min(
        canvas.height || 0,
        frameBounds.top + frameBounds.height + this.LINE_EXTENSION
      );
      snapLineMinX = Math.max(0, frameBounds.left - this.LINE_EXTENSION);
      snapLineMaxX = Math.min(
        canvas.width || 0,
        frameBounds.left + frameBounds.width + this.LINE_EXTENSION
      );
    }

    // Check vertical snaps (left, center, right)
    const verticalSnapPoints = snapPoints.filter((p) => p.type === 'vertical');
    const verticalChecks = [
      { value: objLeft, offset: 0, edge: 'left' },
      { value: objCenterX, offset: -objWidth / 2, edge: 'center' },
      { value: objRight, offset: -objWidth, edge: 'right' }
    ];

    for (const check of verticalChecks) {
      for (const snapPoint of verticalSnapPoints) {
        const distance = Math.abs(check.value - snapPoint.value);

        if (distance < this.SNAP_THRESHOLD) {
          snappedLeft = snapPoint.value + check.offset;
          snapped = true;

          // Create vertical snap line within frame bounds (extended)
          const line = this.createVerticalSnapLine(snapPoint.value, snapLineMinY, snapLineMaxY);
          newSnapLines.push(line);
          break;
        }
      }
    }

    // Check horizontal snaps (top, center, bottom)
    const horizontalSnapPoints = snapPoints.filter((p) => p.type === 'horizontal');
    const horizontalChecks = [
      { value: objTop, offset: 0, edge: 'top' },
      { value: objCenterY, offset: -objHeight / 2, edge: 'center' },
      { value: objBottom, offset: -objHeight, edge: 'bottom' }
    ];

    for (const check of horizontalChecks) {
      for (const snapPoint of horizontalSnapPoints) {
        const distance = Math.abs(check.value - snapPoint.value);

        if (distance < this.SNAP_THRESHOLD) {
          snappedTop = snapPoint.value + check.offset;
          snapped = true;

          // Create horizontal snap line within frame bounds (extended)
          const line = this.createHorizontalSnapLine(snapPoint.value, snapLineMinX, snapLineMaxX);
          newSnapLines.push(line);
          break;
        }
      }
    }

    return {
      snapped,
      snapLines: newSnapLines,
      snapPosition: {
        left: snappedLeft,
        top: snappedTop
      }
    };
  }

  /**
   * Show snap lines on canvas
   */
  showSnapLines(snapLines: Line[]): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    // Remove old snap lines first
    this.clearSnapLines();

    // Add new snap lines and bring to front
    snapLines.forEach((line) => {
      canvas.add(line);
      canvas.bringObjectToFront(line);
      this.activeSnapLines.push(line);
    });

    canvas.renderAll();
  }

  /**
   * Clear all snap lines from canvas
   */
  clearSnapLines(): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    this.activeSnapLines.forEach((line) => {
      canvas.remove(line);
    });

    this.activeSnapLines = [];
    canvas.renderAll();
  }

  /**
   * Collect all snap points from canvas objects and frame
   */
  private collectSnapPoints(excludeObject: FabricObject): SnapPoint[] {
    const canvas = this.stateService.getCanvas();
    const frame = this.stateService.getFrameObject();
    const snapPoints: SnapPoint[] = [];

    if (!canvas) return snapPoints;

    // Add frame snap points if frame exists
    if (frame) {
      const frameBounds = frame.getBoundingRect();

      // Vertical snap points (left, center, right)
      snapPoints.push(
        { value: frameBounds.left, type: 'vertical', source: 'frame' },
        { value: frameBounds.left + frameBounds.width / 2, type: 'vertical', source: 'center' },
        { value: frameBounds.left + frameBounds.width, type: 'vertical', source: 'frame' }
      );

      // Horizontal snap points (top, center, bottom)
      snapPoints.push(
        { value: frameBounds.top, type: 'horizontal', source: 'frame' },
        { value: frameBounds.top + frameBounds.height / 2, type: 'horizontal', source: 'center' },
        { value: frameBounds.top + frameBounds.height, type: 'horizontal', source: 'frame' }
      );
    }

    // Add snap points from other objects
    canvas.getObjects().forEach((obj) => {
      // Skip the moving object, frame, and snap lines
      if (obj === excludeObject || obj === frame || this.isSnapLine(obj)) {
        return;
      }

      const bounds = obj.getBoundingRect();

      // Vertical snap points (left, center, right)
      snapPoints.push(
        { value: bounds.left, type: 'vertical', source: 'object' },
        { value: bounds.left + bounds.width / 2, type: 'vertical', source: 'object' },
        { value: bounds.left + bounds.width, type: 'vertical', source: 'object' }
      );

      // Horizontal snap points (top, center, bottom)
      snapPoints.push(
        { value: bounds.top, type: 'horizontal', source: 'object' },
        { value: bounds.top + bounds.height / 2, type: 'horizontal', source: 'object' },
        { value: bounds.top + bounds.height, type: 'horizontal', source: 'object' }
      );
    });

    return snapPoints;
  }

  /**
   * Create a vertical snap line
   */
  private createVerticalSnapLine(x: number, y1: number, y2: number): Line {
    const line = new Line([x, y1, x, y2], {
      stroke: this.LINE_COLOR,
      strokeWidth: this.LINE_STROKE_WIDTH,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      objectCaching: false,
      // Prevent clipping by frame
      clipPath: undefined
    });

    // Mark as snap line for easy identification
    line.set('isSnapLine', true);

    return line;
  }

  /**
   * Create a horizontal snap line
   */
  private createHorizontalSnapLine(y: number, x1: number, x2: number): Line {
    const line = new Line([x1, y, x2, y], {
      stroke: this.LINE_COLOR,
      strokeWidth: this.LINE_STROKE_WIDTH,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      objectCaching: false,
      // Prevent clipping by frame
      clipPath: undefined
    });

    // Mark as snap line for easy identification
    line.set('isSnapLine', true);

    return line;
  }

  /**
   * Check if an object is a snap line
   */
  private isSnapLine(obj: FabricObject): boolean {
    return (obj as any).isSnapLine === true;
  }

  /**
   * Enable snap functionality
   */
  enableSnap(): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;

      const result = this.calculateSnap(obj, obj.left || 0, obj.top || 0);

      if (result.snapped) {
        obj.set({
          left: result.snapPosition.left,
          top: result.snapPosition.top
        });
        obj.setCoords();
        this.showSnapLines(result.snapLines);
      } else {
        this.clearSnapLines();
      }
    });

    canvas.on('object:modified', () => {
      this.clearSnapLines();
    });

    canvas.on('mouse:up', () => {
      this.clearSnapLines();
    });
  }

  /**
   * Disable snap functionality
   */
  disableSnap(): void {
    this.clearSnapLines();
  }
}
