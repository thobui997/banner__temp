import { inject, Injectable } from '@angular/core';
import { FabricObject } from 'fabric';
import { BehaviorSubject, Observable } from 'rxjs';
import { VariableType } from '../../../consts';
import { Layer } from '../../../types';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { ObjectPropertiesExtractorService } from '../objects/object-properties-extractor.service';

@Injectable()
export class LayerManagementService {
  private stateService = inject(CanvasStateService);
  private propertiesExtractor = inject(ObjectPropertiesExtractorService);

  private layersSubject = new BehaviorSubject<Layer[]>([]);
  private selectedLayerIdSubject = new BehaviorSubject<string | null>(null);
  private layerNameChangedSubject = new BehaviorSubject<{ layerId: string; name: string } | null>(
    null
  );

  readonly layers$: Observable<Layer[]> = this.layersSubject.asObservable();
  readonly selectedLayerId$: Observable<string | null> = this.selectedLayerIdSubject.asObservable();
  readonly layerNameChanged$: Observable<{ layerId: string; name: string } | null> =
    this.layerNameChangedSubject.asObservable();

  private layerCounters = {
    text: 0,
    image: 0,
    button: 0
  };

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
          name: metadata.customName || this.generateLayerName(obj, type),
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

  /**
   * Rename layer
   */
  renameLayer(layerId: string, newName: string): void {
    const layer = this.findLayerById(layerId);
    if (!layer || !layer.fabricObject) return;

    // Update custom metadata
    const metadata = layer.fabricObject.get('customMetadata') as any;
    if (metadata) {
      metadata.customName = newName;
      layer.fabricObject.set('customMetadata', metadata);
    }

    // Update layer name in state
    layer.name = newName;
    this.layersSubject.next([...this.layersSubject.value]);

    // Emit layer name changed event
    this.layerNameChangedSubject.next({ layerId, name: newName });
  }

  /**
   * Generate default layer name based on type
   */
  private generateLayerName(obj: FabricObject, type: string): string {
    const metadata = obj.get('customMetadata') as any;

    if (metadata?.customName) {
      return metadata.customName;
    }

    switch (type) {
      case VariableType.TEXT: {
        this.layerCounters.text++;
        const name = `Text ${this.layerCounters.text}`;
        if (metadata) {
          metadata.customName = name;
          obj.set('customMetadata', metadata);
        }
        return name;
      }

      case VariableType.IMAGE: {
        this.layerCounters.image++;
        const imageName = `Image ${this.layerCounters.image}`;
        if (metadata) {
          metadata.customName = imageName;
          obj.set('customMetadata', metadata);
        }
        return imageName;
      }

      case VariableType.BUTTON: {
        this.layerCounters.button++;
        const buttonName = `Button ${this.layerCounters.button}`;
        if (metadata) {
          metadata.customName = buttonName;
          obj.set('customMetadata', metadata);
        }
        return buttonName;
      }

      case VariableType.FRAME: {
        const frameName = 'Background';
        if (metadata) {
          metadata.customName = frameName;
          obj.set('customMetadata', metadata);
        }
        return frameName;
      }

      default:
        return 'Shape';
    }
  }

  /**
   * Reset layer counters (useful when loading template)
   */
  resetCounters(): void {
    this.layerCounters = {
      text: 0,
      image: 0,
      button: 0
    };
  }

  /**
   * Get layer name by id
   */
  getLayerName(layerId: string): string {
    const layer = this.findLayerById(layerId);
    return layer?.name || '';
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
      for (let i = 0; i < offset; i++) {
        canvas.bringObjectForward(movedLayer.fabricObject);
      }
    } else if (offset < 0) {
      for (let i = 0; i < Math.abs(offset); i++) {
        canvas.sendObjectBackwards(movedLayer.fabricObject);
      }
    }

    this.syncLayers();
    canvas.requestRenderAll();
  }

  selectLayer(layerId: string): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const layer = this.findLayerById(layerId);
    if (!layer || !layer.fabricObject) return;

    this.selectedLayerIdSubject.next(layerId);

    canvas.setActiveObject(layer.fabricObject);
    canvas.requestRenderAll();
  }

  hoverLayer(layerId: string | null): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    // Remove previous hover effects
    canvas.getObjects().forEach((obj) => {
      obj.set({
        strokeWidth: 0,
        underline: false
      });
    });

    if (layerId) {
      const layer = this.findLayerById(layerId);
      if (layer && layer.fabricObject) {
        const obj = layer.fabricObject;

        // Check if object is text (IText or Textbox)
        if (
          obj.type === 'i-text' ||
          obj.type === 'IText' ||
          obj.type === 'textbox' ||
          obj.type === 'Textbox'
        ) {
          // For text objects, apply underline effect (like Figma)
          obj.set({
            underline: true,
            stroke: undefined,
            strokeWidth: 0
          });
        } else {
          // For other objects (image, button, frame, etc.), apply border effect
          obj.set({
            stroke: '#007AFF',
            strokeWidth: 2,
            strokeDashArray: [5, 5]
          });
        }
      }
    }

    canvas.requestRenderAll();
  }

  toggleVisibility(layerId: string): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const layer = this.findLayerById(layerId);
    if (!layer || !layer.fabricObject) return;

    const newVisibility = !layer.visible;
    layer.fabricObject.set('visible', newVisibility);
    layer.visible = newVisibility;

    if (!newVisibility) {
      const activeObject = canvas.getActiveObject();
      if (activeObject === layer.fabricObject) {
        canvas.discardActiveObject();
        this.selectedLayerIdSubject.next(null);
      }
    }

    this.layersSubject.next([...this.layersSubject.value]);
    canvas.requestRenderAll();
  }

  deleteLayer(layerId: string): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const layer = this.findLayerById(layerId);
    if (!layer || !layer.fabricObject) return;

    if (layer.type === VariableType.FRAME) {
      console.warn('Cannot delete frame layer');
      return;
    }

    if (this.selectedLayerIdSubject.value === layerId) {
      this.selectedLayerIdSubject.next(null);
    }

    canvas.remove(layer.fabricObject);
    this.syncLayers();
    canvas.requestRenderAll();
  }

  getLayers(): Layer[] {
    return this.layersSubject.value;
  }

  isFrameLayer(layerId: string): boolean {
    const layer = this.findLayerById(layerId);
    return layer?.type === VariableType.FRAME;
  }

  canDeleteLayer(layerId: string): boolean {
    const layer = this.findLayerById(layerId);
    return layer?.type !== VariableType.FRAME;
  }

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

  private findLayerById(layerId: string): Layer | undefined {
    return this.layersSubject.value.find((layer) => layer.id === layerId);
  }
}
