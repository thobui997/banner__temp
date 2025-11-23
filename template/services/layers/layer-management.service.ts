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

  // Track if we're manually reordering to prevent sync conflicts
  private isReordering = false;

  readonly layers$: Observable<Layer[]> = this.layersSubject.asObservable();
  readonly selectedLayerId$: Observable<string | null> = this.selectedLayerIdSubject.asObservable();

  /**
   * Sync layers from canvas objects
   */
  syncLayers(): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    // Skip sync if we're in the middle of reordering
    if (this.isReordering) return;

    const objects = canvas.getObjects();
    const layers: Layer[] = [];
    let frameLayer: Layer | null = null;

    objects.forEach((obj, index) => {
      const metadata = obj.get('customMetadata') as any;
      const type = this.propertiesExtractor.getObjectType(obj);

      if (metadata && metadata.id) {
        const layer: Layer = {
          id: metadata.id,
          name: this.generateLayerName(obj, type),
          type: type,
          visible: obj.visible !== false,
          locked: obj.lockMovementX === true,
          order: index,
          fabricObject: obj
        };

        // Separate frame from other layers
        if (type === VariableType.FRAME) {
          frameLayer = layer;
        } else {
          layers.push(layer);
        }
      }
    });

    // Sort regular layers by order (highest first - top to bottom in UI)
    layers.sort((a, b) => b.order - a.order);

    // Add frame at the end if exists (always at bottom)
    if (frameLayer) {
      (frameLayer as Layer).order = -1; // Ensure frame is always at bottom
      layers.push(frameLayer);
    }

    this.layersSubject.next(layers);
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
   * Reorder layers (drag and drop)
   * Frame is excluded from reordering
   */
  reorderLayers(previousIndex: number, currentIndex: number): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    // Set reordering flag to prevent sync conflicts
    this.isReordering = true;

    const layers = [...this.layersSubject.value];

    // Separate frame from other layers
    const frameLayer = layers.find((l) => l.type === VariableType.FRAME);
    const regularLayers = layers.filter((l) => l.type !== VariableType.FRAME);

    //  Validate indices before accessing array
    if (previousIndex < 0 || previousIndex >= layers.length) {
      console.warn('Invalid previousIndex:', previousIndex);
      this.isReordering = false;
      return;
    }

    if (currentIndex < 0 || currentIndex >= layers.length) {
      console.warn('Invalid currentIndex:', currentIndex);
      this.isReordering = false;
      return;
    }

    // Get the layer being moved
    const movedLayer = layers[previousIndex];

    if (!movedLayer) {
      console.warn('Layer at previousIndex not found');
      this.isReordering = false;
      return;
    }

    // Check if trying to drag frame
    if (movedLayer.type === VariableType.FRAME) {
      console.warn('Cannot reorder frame layer');
      this.isReordering = false;
      return;
    }

    // Check if trying to drag to frame position (last position)
    if (frameLayer && currentIndex === layers.length - 1) {
      console.warn('Cannot move layer below frame');
      this.isReordering = false;
      return;
    }

    // Find actual indices in regularLayers array
    const regularPreviousIndex = regularLayers.findIndex((l) => l.id === movedLayer.id);

    // Calculate target index in regularLayers (accounting for frame at end)
    let regularCurrentIndex = currentIndex;
    if (frameLayer && currentIndex >= regularLayers.length) {
      regularCurrentIndex = regularLayers.length - 1;
    }

    if (regularPreviousIndex === -1) {
      console.warn('Layer not found in regularLayers');
      this.isReordering = false;
      return;
    }

    // Reorder only regular layers
    const [movedRegularLayer] = regularLayers.splice(regularPreviousIndex, 1);
    regularLayers.splice(regularCurrentIndex, 0, movedRegularLayer);

    // Update order based on new position in array
    // Higher position in array = higher order = appears on top in canvas
    regularLayers.forEach((layer, index) => {
      if (layer) {
        layer.order = regularLayers.length - index - 1;
      }
    });

    // Combine back with frame at the end
    const reorderedLayers = frameLayer ? [...regularLayers, frameLayer] : regularLayers;

    // Update canvas object z-index
    this.updateCanvasZIndex(reorderedLayers);

    this.layersSubject.next(reorderedLayers);
    canvas.requestRenderAll();

    // Reset reordering flag after a short delay
    setTimeout(() => {
      this.isReordering = false;
    }, 100);
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
   * Update canvas z-index based on layer order
   * Frame always stays at the back
   */
  private updateCanvasZIndex(layers: Layer[]): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    // Separate frame and regular layers
    const frameLayer = layers.find((l) => l.type === VariableType.FRAME);
    const regularLayers = layers.filter((l) => l.type !== VariableType.FRAME);

    const allObjects = canvas.getObjects();
    const sortedLayers = [...regularLayers].sort((a, b) => a.order - b.order);

    // Clear canvas (this removes all objects but keeps references)
    allObjects.forEach((obj) => canvas.remove(obj));

    // Add frame first (will be at back)
    if (frameLayer && frameLayer.fabricObject) {
      canvas.add(frameLayer.fabricObject);
    }

    // Add regular layers in order (lowest to highest)
    sortedLayers.forEach((layer) => {
      if (layer.fabricObject) {
        canvas.add(layer.fabricObject);
      }
    });
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
