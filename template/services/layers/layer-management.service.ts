import { inject, Injectable } from '@angular/core';
import { FabricObject } from 'fabric';
import { BehaviorSubject, Observable } from 'rxjs';
import { Layer } from '../../types/layer.type';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { ObjectPropertiesExtractorService } from '../objects/object-properties-extractor.service';
import { VariableType } from '../../consts/variables.const';

@Injectable()
export class LayerManagementService {
  private stateService = inject(CanvasStateService);
  private propertiesExtractor = inject(ObjectPropertiesExtractorService);

  private layersSubject = new BehaviorSubject<Layer[]>([]);
  private selectedLayerIdSubject = new BehaviorSubject<string | null>(null);

  readonly layers$: Observable<Layer[]> = this.layersSubject.asObservable();
  readonly selectedLayerId$: Observable<string | null> = this.selectedLayerIdSubject.asObservable();

  syncLayers(): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const objects = canvas.getObjects();
    const layers: Layer[] = [];
    let frameLayer: Layer | null = null;

    objects.forEach((obj) => {
      const metadata = obj.get('customMetadata') as any;
      const type = this.propertiesExtractor.getObjectType(obj);

      if (metadata && metadata.id) {
        const layer: Layer = {
          id: metadata.id,
          name: this.generateLayerName(obj, type),
          type: type,
          visible: obj.visible !== false,
          locked: obj.lockMovementX === true,
          fabricObject: obj
        };

        if (type === VariableType.FRAME) {
          frameLayer = layer;
        } else {
          layers.push(layer);
        }
      }
    });

    layers.reverse();

    if (frameLayer) {
      layers.push(frameLayer);
    }

    this.layersSubject.next(layers);
  }

  reorderLayers(previousIndex: number, currentIndex: number): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const layers = [...this.layersSubject.value];

    if (previousIndex < 0 || previousIndex >= layers.length) return;
    if (currentIndex < 0 || currentIndex >= layers.length) return;

    const movedLayer = layers[previousIndex];
    if (!movedLayer || !movedLayer.fabricObject) return;

    if (movedLayer.type === VariableType.FRAME) {
      console.warn('Cannot reorder frame layer');
      return;
    }

    const frameIndex = layers.findIndex((l) => l.type === VariableType.FRAME);

    if (frameIndex !== -1 && currentIndex >= frameIndex) {
      console.warn('Cannot move layer below frame');
      return;
    }

    const regularLayerCount = layers.length - (frameIndex !== -1 ? 1 : 0);

    const targetFabricIndex = regularLayerCount - currentIndex - 1; 

    const currentFabricObjects = canvas
      .getObjects()
      .filter((obj) => this.propertiesExtractor.getObjectType(obj) !== VariableType.FRAME);

    const currentFabricIndex = currentFabricObjects.findIndex(
      (obj) => obj === movedLayer.fabricObject
    );

    if (currentFabricIndex === -1) return;

    const offset = targetFabricIndex - currentFabricIndex;

    if (offset > 0) {
      // Move to front
      for (let i = 0; i < offset; i++) {
        canvas.bringObjectForward(movedLayer.fabricObject);
      }
    } else if (offset < 0) {
      // Move to back
      for (let i = 0; i < Math.abs(offset); i++) {
        canvas.sendObjectBackwards(movedLayer.fabricObject);
      }
    }

    this.syncLayers();
    canvas.requestRenderAll();
  }

  /**
   * Select layer (and its corresponding object)
   */
  selectLayer(layerId: string): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const layer = this.findLayerById(layerId);
    if (!layer || !layer.fabricObject) return;

    this.selectedLayerIdSubject.next(layerId);

    canvas.setActiveObject(layer.fabricObject);
    canvas.requestRenderAll();
  }

  /**
   * Hover layer (highlight object on canvas)
   */
  hoverLayer(layerId: string | null): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    // Remove previous hover effect
    canvas.getObjects().forEach((obj) => {
      obj.set('strokeWidth', 0);
    });

    if (layerId) {
      const layer = this.findLayerById(layerId);
      if (layer && layer.fabricObject) {
        // Add hover effect
        layer.fabricObject.set({
          stroke: '#007AFF',
          strokeWidth: 2,
          strokeDashArray: [5, 5]
        });
      }
    }

    canvas.requestRenderAll();
  }

  /**
   * Toggle layer visibility
   */
  toggleVisibility(layerId: string): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const layer = this.findLayerById(layerId);
    if (!layer || !layer.fabricObject) return;

    const newVisibility = !layer.visible;
    layer.fabricObject.set('visible', newVisibility);
    layer.visible = newVisibility;

    // If hiding selected object, deselect it
    if (!newVisibility) {
      const activeObject = canvas.getActiveObject();
      if (activeObject === layer.fabricObject) {
        canvas.discardActiveObject();
        this.selectedLayerIdSubject.next(null);
      }
    }

    // Update layers
    this.layersSubject.next([...this.layersSubject.value]);
    canvas.requestRenderAll();
  }

  /**
   * Delete layer
   */
  deleteLayer(layerId: string): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const layer = this.findLayerById(layerId);
    if (!layer || !layer.fabricObject) return;

    // Prevent deleting frame
    if (layer.type === VariableType.FRAME) {
      console.warn('Cannot delete frame layer');
      return;
    }

    // If deleting selected object, clear selection
    if (this.selectedLayerIdSubject.value === layerId) {
      this.selectedLayerIdSubject.next(null);
    }

    // Remove from canvas
    canvas.remove(layer.fabricObject);

    // Re-sync layers
    this.syncLayers();
    canvas.requestRenderAll();
  }

  /**
   * Get current layers
   */
  getLayers(): Layer[] {
    return this.layersSubject.value;
  }

  /**
   * Check if layer is frame
   */
  isFrameLayer(layerId: string): boolean {
    const layer = this.findLayerById(layerId);
    return layer?.type === VariableType.FRAME;
  }

  /**
   * Check if layer can be deleted
   */
  canDeleteLayer(layerId: string): boolean {
    const layer = this.findLayerById(layerId);
    return layer?.type !== VariableType.FRAME;
  }

  /**
   * Update selected layer ID from canvas object
   * Called when object is selected on canvas
   */
  updateSelectedLayerFromObject(obj: FabricObject | null): void {
    if (!obj) {
      this.selectedLayerIdSubject.next(null);
      return;
    }

    const metadata = obj.get('customMetadata') as any;
    if (metadata && metadata.id) {
      this.selectedLayerIdSubject.next(metadata.id);
    }
  }

  /**
   * Find layer by ID
   */
  private findLayerById(layerId: string): Layer | undefined {
    return this.layersSubject.value.find((layer) => layer.id === layerId);
  }

  /**
   * Generate human-readable layer name
   */
  private generateLayerName(obj: FabricObject, type: string): string {
    const metadata = obj.get('customMetadata') as any;

    switch (type) {
      case VariableType.TEXT: {
        const text = (obj as any).text || 'Text';
        return text.length > 20 ? text.substring(0, 20) + '...' : text;
      }

      case VariableType.IMAGE:
        return 'Image';

      case VariableType.BUTTON: {
        const buttonText = metadata?.text || 'Button';
        return buttonText.length > 20 ? buttonText.substring(0, 20) + '...' : buttonText;
      }

      case VariableType.FRAME:
        return 'Frame';

      default:
        return 'Shape';
    }
  }
}
