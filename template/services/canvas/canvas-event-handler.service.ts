import { inject, Injectable } from '@angular/core';
import { Canvas, FabricObject, ModifiedEvent, TPointerEvent } from 'fabric/*';
import { MoveObjectCommand } from '../../commands/move-object.command';
import { RotateObjectCommand } from '../../commands/rotate-object.command';
import { ScaleObjectCommand } from '../../commands/scale-object.command';
import { CommandManagerService } from '../command/command-manager.service';
import { LayerManagementService } from '../layers/layer-management.service';
import { ObjectPropertiesExtractorService } from '../objects/object-properties-extractor.service';
import { CanvasStateService } from './canvas-state.service';

@Injectable()
export class CanvasEventHandlerService {
  private stateService = inject(CanvasStateService);
  private propertiesExtractor = inject(ObjectPropertiesExtractorService);
  private layerManagementService = inject(LayerManagementService);
  private commandManager = inject(CommandManagerService);

  private lastStateBeforeTransform = new WeakMap<FabricObject, any>();

  setupEventListeners(canvas: Canvas): void {
    // Selection events
    canvas.on('selection:created', (e) => {
      this.handleSelectionChange(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e) => {
      this.handleSelectionChange(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      this.handleSelectionChange(null);
    });

    // Object modification events
    canvas.on('object:modified', (e) => {
      if (!e.target) return;
      this.handleObjectModified(e);
    });

    // Real-time constraint events
    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;

      if (!this.lastStateBeforeTransform.has(obj)) {
        this.lastStateBeforeTransform.set(obj, {
          left: obj.left,
          top: obj.top
        });
      }

      this.emitObjectProperties(obj);
    });

    canvas.on('object:scaling', (e) => {
      const obj = e.target;
      if (!obj) return;

      if (!this.lastStateBeforeTransform.has(obj)) {
        this.lastStateBeforeTransform.set(obj, {
          scaleX: obj.scaleX,
          scaleY: obj.scaleY
        });
      }

      this.emitObjectProperties(obj);
    });

    canvas.on('object:rotating', (e) => {
      const obj = e.target;
      if (!obj) return;

      if (!this.lastStateBeforeTransform.has(obj)) {
        this.lastStateBeforeTransform.set(obj, {
          angle: obj.angle
        });
      }

      this.emitObjectProperties(obj);
    });

    // Layer sync events
    canvas.on('object:added', (e) => {
      // Only sync if it's a new object creation, not during reordering
      setTimeout(() => {
        this.layerManagementService.syncLayers();
      }, 50);
    });

    canvas.on('object:removed', (e) => {
      setTimeout(() => {
        this.layerManagementService.syncLayers();
      }, 50);
    });

    // Initialize layers
    this.layerManagementService.syncLayers();
  }

  private handleSelectionChange(obj: FabricObject | null): void {
    this.stateService.updateSelectedObject(obj);

    // Update selected layer in layer panel
    this.layerManagementService.updateSelectedLayerFromObject(obj);

    if (obj) {
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
}
