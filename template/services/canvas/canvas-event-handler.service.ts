import { inject, Injectable } from '@angular/core';
import { Canvas, FabricObject, ModifiedEvent, TPointerEvent } from 'fabric/*';
import { MoveObjectCommand } from '../../commands/move-object.command';
import { RotateObjectCommand } from '../../commands/rotate-object.command';
import { ScaleObjectCommand } from '../../commands/scale-object.command';
import { CommandManagerService } from '../command/command-manager.service';
import { LayerManagementService } from '../layers/layer-management.service';
import { ObjectPropertiesExtractorService } from '../objects/object-properties-extractor.service';
import { CanvasStateService } from './canvas-state.service';
import { FrameManagementService } from '../frame/frame-management.service';
import { UpdateFrameCommand } from '../../commands/update-frame.command';
import { SnapLineService } from './canvas-snap-line.service';

@Injectable()
export class CanvasEventHandlerService {
  private stateService = inject(CanvasStateService);
  private propertiesExtractor = inject(ObjectPropertiesExtractorService);
  private layerManagementService = inject(LayerManagementService);
  private commandManager = inject(CommandManagerService);
  private frameManagement = inject(FrameManagementService);
  private snapLineService = inject(SnapLineService);

  private lastStateBeforeTransform = new WeakMap<FabricObject, any>();
  private snapEnabled = true;

  // Store frame's last position to calculate delta when moving
  private frameLastPosition = { left: 0, top: 0 };

  private eventHandlers = new Map<string, any>();

  setupEventListeners(canvas: Canvas): void {
    const selectionCreatedHandler = (e: any) => {
      this.handleSelectionChange(e.selected?.[0] || null);
    };

    const selectionUpdatedHandler = (e: any) => {
      this.handleSelectionChange(e.selected?.[0] || null);
    };

    const selectionClearedHandler = () => {
      this.handleSelectionChange(null);
    };

    const objectModifiedHandler = (e: ModifiedEvent<TPointerEvent>) => {
      if (!e.target) return;
      this.handleObjectModified(e);
      this.snapLineService.clearSnapLines();
    };

    const objectMovingHandler = (e: any) => {
      const obj = e.target;
      if (!obj) return;

      if (!this.lastStateBeforeTransform.has(obj)) {
        this.lastStateBeforeTransform.set(obj, {
          left: obj.left,
          top: obj.top
        });
      }

      // Handle frame movement - move all objects along with frame
      if (this.isFrame(obj)) {
        this.moveObjectsWithFrame(obj);
      } else {
        // Apply snap lines if enabled and not moving frame
        if (this.snapEnabled) {
          const snapResult = this.snapLineService.calculateSnap(obj, obj.left || 0, obj.top || 0);

          if (snapResult.snapped) {
            obj.set({
              left: snapResult.snapPosition.left,
              top: snapResult.snapPosition.top
            });
            obj.setCoords();
            this.snapLineService.showSnapLines(snapResult.snapLines);
          } else {
            this.snapLineService.clearSnapLines();
          }

          this.frameManagement.applyFrameClipping(obj);
        } else {
          this.frameManagement.applyFrameClipping(obj);
        }
      }

      this.emitObjectProperties(obj);
    };

    const objectScalingHandler = (e: any) => {
      const obj = e.target;
      if (!obj) return;

      if (!this.lastStateBeforeTransform.has(obj)) {
        this.lastStateBeforeTransform.set(obj, {
          scaleX: obj.scaleX,
          scaleY: obj.scaleY
        });
      }

      if (!this.isFrame(obj)) {
        this.frameManagement.applyFrameClipping(obj);
      } else {
        // Enforce aspect ratio for frame during scaling
        this.frameManagement.enforceAspectRatio(obj);
        this.frameManagement.updateFrameBounds(obj);
        this.frameManagement.applyClippingToAllObjects();
      }

      this.emitObjectProperties(obj);
    };

    const objectRotatingHandler = (e: any) => {
      const obj = e.target;
      if (!obj) return;

      if (!this.lastStateBeforeTransform.has(obj)) {
        this.lastStateBeforeTransform.set(obj, {
          angle: obj.angle
        });
      }

      if (!this.isFrame(obj)) {
        this.frameManagement.applyFrameClipping(obj);
      }

      this.emitObjectProperties(obj);
    };

    const mouseUpHandler = () => {
      this.snapLineService.clearSnapLines();
    };

    const objectAddedHandler = (e: any) => {
      const obj = e.target;

      // Apply frame clipping to newly added objects
      if (obj && !this.isFrame(obj)) {
        this.frameManagement.applyFrameClipping(obj);
      }

      // Store initial frame position when frame is added
      if (obj && this.isFrame(obj)) {
        this.frameLastPosition = {
          left: obj.left || 0,
          top: obj.top || 0
        };
      }

      setTimeout(() => {
        this.layerManagementService.syncLayers();
      }, 50);
    };

    const objectRemovedHandler = (e: any) => {
      setTimeout(() => {
        this.layerManagementService.syncLayers();
      }, 50);
    };

    // Store handlers in map
    this.eventHandlers.set('selection:created', selectionCreatedHandler);
    this.eventHandlers.set('selection:updated', selectionUpdatedHandler);
    this.eventHandlers.set('selection:cleared', selectionClearedHandler);
    this.eventHandlers.set('object:modified', objectModifiedHandler);
    this.eventHandlers.set('object:moving', objectMovingHandler);
    this.eventHandlers.set('object:scaling', objectScalingHandler);
    this.eventHandlers.set('object:rotating', objectRotatingHandler);
    this.eventHandlers.set('mouse:up', mouseUpHandler);
    this.eventHandlers.set('object:added', objectAddedHandler);
    this.eventHandlers.set('object:removed', objectRemovedHandler);

    // Register event listeners
    canvas.on('selection:created', selectionCreatedHandler);
    canvas.on('selection:updated', selectionUpdatedHandler);
    canvas.on('selection:cleared', selectionClearedHandler);
    canvas.on('object:modified', objectModifiedHandler);
    canvas.on('object:moving', objectMovingHandler);
    canvas.on('object:scaling', objectScalingHandler);
    canvas.on('object:rotating', objectRotatingHandler);
    canvas.on('mouse:up', mouseUpHandler);
    canvas.on('object:added', objectAddedHandler);
    canvas.on('object:removed', objectRemovedHandler);

    // Initialize layers
    this.layerManagementService.syncLayers();

    // Enable snap by default
    this.enableSnap();
  }

  /**
   * Enable snap functionality
   */
  enableSnap(): void {
    this.snapEnabled = true;
  }

  /**
   * Disable snap functionality
   */
  disableSnap(): void {
    this.snapEnabled = false;
    this.snapLineService.clearSnapLines();
  }

  /**
   * Toggle snap functionality
   */
  toggleSnap(): void {
    this.snapEnabled = !this.snapEnabled;
    if (!this.snapEnabled) {
      this.snapLineService.clearSnapLines();
    }
  }

  /**
   * Check if snap is enabled
   */
  isSnapEnabled(): boolean {
    return this.snapEnabled;
  }

  disableAllEvents(): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    // Remove all event listeners using stored handlers
    this.eventHandlers.forEach((handler, eventName) => {
      canvas.off(eventName as any, handler as any);
    });

    // Clear snap lines
    this.snapLineService.clearSnapLines();

    // Clear the handlers map
    this.eventHandlers.clear();
  }

  private handleSelectionChange(obj: FabricObject | null): void {
    this.stateService.updateSelectedObject(obj);

    // Update selected layer in layer panel
    this.layerManagementService.updateSelectedLayerFromObject(obj);

    if (obj) {
      // Store current frame position when selecting frame
      if (this.isFrame(obj)) {
        this.frameLastPosition = {
          left: obj.left || 0,
          top: obj.top || 0
        };
      }

      this.emitObjectProperties(obj);
    } else {
      this.stateService.updateSelectedObjectProperties(null);
    }
  }

  private handleObjectModified(e: ModifiedEvent<TPointerEvent>): void {
    const obj = e.target;
    if (!e) return;

    const canvas = this.stateService.getCanvas();
    const prev = this.lastStateBeforeTransform.get(obj);
    this.lastStateBeforeTransform.delete(obj);

    if (!prev) return;

    // Handle frame modifications separately
    if (this.isFrame(obj)) {
      this.handleFrameModified(obj, prev);
      return;
    }

    if ('left' in prev && 'top' in prev) {
      const command = new MoveObjectCommand(
        canvas,
        obj,
        prev.left,
        prev.top,
        obj.left ?? 0,
        obj.top ?? 0,
        () => this.emitObjectProperties(obj)
      );
      this.commandManager.execute(command);
    } else if ('scaleX' in prev && 'scaleY' in prev) {
      const command = new ScaleObjectCommand(
        canvas,
        obj,
        prev.scaleX,
        prev.scaleY,
        obj.scaleX ?? 1,
        obj.scaleY ?? 1,
        () => this.emitObjectProperties(obj)
      );
      this.commandManager.execute(command);
    } else if ('angle' in prev) {
      const command = new RotateObjectCommand(canvas, obj, prev.angle, obj.angle ?? 0, () =>
        this.emitObjectProperties(obj)
      );
      this.commandManager.execute(command);
    }
  }

  emitObjectProperties(obj: FabricObject): void {
    const properties = this.propertiesExtractor.extractProperties(obj);
    this.stateService.updateSelectedObjectProperties(properties);
  }

  emitCurrentObjectProperties(): void {
    const canvas = this.stateService.getCanvas();
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      this.emitObjectProperties(activeObject);
    }
  }

  private isFrame(obj: FabricObject): boolean {
    const metadata = obj.get('customMetadata') as any;
    return metadata?.isMainFrame === true;
  }

  private handleFrameModified(frame: FabricObject, prev: any): void {
    const canvas = this.stateService.getCanvas();

    // Create command for frame modification
    const command = new UpdateFrameCommand(
      canvas,
      frame,
      {
        ...frame,
        ...prev
      },
      {
        left: frame.left,
        top: frame.top,
        scaleX: frame.scaleX,
        scaleY: frame.scaleY,
        width: frame.width,
        height: frame.height
      },
      () => {
        this.frameManagement.updateFrameBounds(frame);
        this.frameManagement.applyClippingToAllObjects();
        this.emitObjectProperties(frame);

        // Update frame last position after modification
        this.frameLastPosition = {
          left: frame.left || 0,
          top: frame.top || 0
        };
      }
    );

    this.commandManager.execute(command);
  }

  private moveObjectsWithFrame(frame: FabricObject): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const currentLeft = frame.left || 0;
    const currentTop = frame.top || 0;

    // Calculate delta movement
    const deltaX = currentLeft - this.frameLastPosition.left;
    const deltaY = currentTop - this.frameLastPosition.top;

    // Update last position
    this.frameLastPosition = { left: currentLeft, top: currentTop };

    // If no movement, skip
    if (deltaX === 0 && deltaY === 0) return;

    // Move all non-frame objects
    canvas.getObjects().forEach((obj) => {
      if (obj === frame) return;

      const objLeft = obj.left || 0;
      const objTop = obj.top || 0;

      obj.set({
        left: objLeft + deltaX,
        top: objTop + deltaY
      });
      obj.setCoords();

      // Update clipPath position as well
      this.frameManagement.applyFrameClipping(obj);
    });

    // Update frame bounds
    this.frameManagement.updateFrameBounds(frame);

    canvas.requestRenderAll();
  }
}
