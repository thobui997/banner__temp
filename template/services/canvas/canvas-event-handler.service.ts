import { inject, Injectable } from '@angular/core';
import { Canvas, FabricObject } from 'fabric/*';
import { VariableType } from '../../consts/variables.const';
import { ObjectConstraintService } from '../objects/object-constraint.service';
import { ObjectPropertiesExtractorService } from '../objects/object-properties-extractor.service';
import { LayerManagementService } from '../layers/layer-management.service';
import { CanvasStateService } from './canvas-state.service';

@Injectable()
export class CanvasEventHandlerService {
  private stateService = inject(CanvasStateService);
  private propertiesExtractor = inject(ObjectPropertiesExtractorService);
  private constraintService = inject(ObjectConstraintService);
  private layerManagementService = inject(LayerManagementService);

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
      if (e.target) {
        this.handleObjectModified(e.target);
      }
    });

    // Real-time constraint events
    canvas.on('object:moving', (e) => {
      if (e.target) {
        this.handleObjectMoving(e.target);
      }
    });

    canvas.on('object:scaling', (e) => {
      if (e.target) {
        this.handleObjectScaling(e.target);
      }
    });

    canvas.on('object:rotating', (e) => {
      if (e.target) {
        this.handleObjectRotating(e.target);
      }
    });

    // Mouse click event for button handling
    canvas.on('mouse:down', (e) => {
      if (e.target) {
        this.handleObjectClick(e.target);
      }
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

  private handleObjectModified(obj: FabricObject): void {
    const type = this.propertiesExtractor.getObjectType(obj);

    // Special handling for frame resize
    if (type === VariableType.FRAME) {
      this.handleFrameResized(obj);
      return;
    }

    // Apply final constraints after modification
    if (this.constraintService.hasFrame()) {
      this.constraintService.applyFrameConstraints(obj);
    }

    this.emitObjectProperties(obj);

    // Re-sync layers (in case object name changed)
    this.layerManagementService.syncLayers();
  }

  /**
   * Handle object moving - Apply frame constraints
   */
  private handleObjectMoving(obj: FabricObject): void {
    const type = this.propertiesExtractor.getObjectType(obj);
    if (type === VariableType.FRAME) return;

    // Apply frame constraints (works for rotated objects too via bounding rect)
    if (this.constraintService.hasFrame()) {
      this.constraintService.applyFrameConstraints(obj);
    }

    this.emitObjectProperties(obj);
  }

  /**
   * Handle object scaling - Apply scale + position constraints
   */
  private handleObjectScaling(obj: FabricObject): void {
    const type = this.propertiesExtractor.getObjectType(obj);

    // If scaling frame, handle frame resize
    if (type === VariableType.FRAME) {
      this.handleFrameScaling(obj);
      return;
    }

    // Apply scale constraints (includes position check)
    if (this.constraintService.hasFrame()) {
      this.constraintService.applyScaleConstraints(obj);
    }

    this.emitObjectProperties(obj);
  }

  /**
   * Handle object rotating - Apply frame constraints
   * Bounding rect approach works perfectly for rotated objects
   */
  private handleObjectRotating(obj: FabricObject): void {
    const type = this.propertiesExtractor.getObjectType(obj);
    if (type === VariableType.FRAME) return;

    // Apply frame constraints (bounding rect handles rotation automatically)
    if (this.constraintService.hasFrame()) {
      this.constraintService.applyFrameConstraints(obj);
    }

    this.emitObjectProperties(obj);
  }

  /**
   * Handle frame resize - Adjust all objects to fit within new frame bounds
   * Called after frame scaling is complete (object:modified event)
   */
  private handleFrameResized(frameObj: FabricObject): void {
    const newFrameBounds = {
      left: frameObj.left || 0,
      top: frameObj.top || 0,
      width: (frameObj.width || 0) * (frameObj.scaleX || 1),
      height: (frameObj.height || 0) * (frameObj.scaleY || 1)
    };

    // Update frame object in state
    this.stateService.updateFrameObject(frameObj);

    // Adjust all objects to fit within new frame
    this.constraintService.handleFrameResize(newFrameBounds);

    // Emit frame properties
    this.emitObjectProperties(frameObj);

    // Re-sync layers
    this.layerManagementService.syncLayers();
  }

  /**
   * Handle frame scaling in real-time (during the scaling operation)
   * Only emits properties for preview, actual constraints applied after scaling complete
   */
  private handleFrameScaling(frameObj: FabricObject): void {
    // Just emit properties for form update
    // Actual constraints will be applied in handleFrameResized (object:modified)
    this.emitObjectProperties(frameObj);
  }

  /**
   * Handle object click event
   * Special handling for button objects với link navigation
   */
  private handleObjectClick(obj: FabricObject): void {
    const type = this.propertiesExtractor.getObjectType(obj);

    // Check if clicked object is a button
    if (type === VariableType.BUTTON) {
      const metadata = obj.get('customMetadata') as any;
      const link = metadata?.link;

      // If button has a link, open it in new tab
      if (link && link.trim() !== '') {
        console.log('Button clicked! Opening link:', link);

        // Validate URL format
        let url = link.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }

        // Open link in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        console.log('Button clicked! (No link configured)');
      }
    }
  }

  private emitObjectProperties(obj: FabricObject): void {
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
