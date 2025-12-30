import { inject, Injectable } from '@angular/core';
import { FabricObject, Rect } from 'fabric';
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

  private hoverOverlay: FabricObject | null = null;

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

    // Remove existing hover overlay
    this.removeHoverOverlay();

    if (layerId) {
      const layer = this.findLayerById(layerId);
      if (layer && layer.fabricObject) {
        this.createHoverOverlay(layer.fabricObject);
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

  /**
   * Create hover overlay for an object without modifying the object itself
   * This prevents position shifts caused by stroke bounds changes
   */
  private createHoverOverlay(obj: any): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const isText = (type: string) => ['i-text', 'textbox', 'text'].includes(type?.toLowerCase());

    // For text objects, use underline instead of overlay
    if (isText(obj.type)) {
      obj.set({ underline: true });
      canvas.requestRenderAll();
      return;
    }

    // For groups (buttons), use the old method - modify stroke directly
    if (obj.type === 'group') {
      this.applyHoverStateToGroup(obj, true);
      canvas.requestRenderAll();
      return;
    }

    if (obj.customMetadata?.type === VariableType.FRAME) {
      obj.set({
        stroke: '#007AFF',
        strokeWidth: 2,
        strokeUniform: true,
        strokeDashArray: [5, 5]
      });
      return;
    }

    // Get object's actual dimensions (before scaling)
    const width = obj.width || 0;
    const height = obj.height || 0;

    // Create overlay rectangle with same dimensions and transforms as object
    const overlay = new Rect({
      left: obj.left || 0,
      top: obj.top || 0,
      width: width,
      height: height,
      angle: obj.angle || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      originX: obj.originX || 'left',
      originY: obj.originY || 'top',
      flipX: obj.flipX || false,
      flipY: obj.flipY || false,
      fill: 'transparent',
      stroke: '#007AFF',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      strokeUniform: true,
      selectable: false,
      evented: false,
      excludeFromExport: true
    });

    // Mark as hover overlay for identification
    (overlay as any).isHoverOverlay = true;

    this.hoverOverlay = overlay;
    canvas.add(overlay);
    canvas.bringObjectToFront(overlay);
  }

  /**
   * Remove hover overlay from canvas
   */
  private removeHoverOverlay(): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    // Remove underline from all text objects
    canvas.getObjects().forEach((obj) => {
      const isText = (type: string) => ['i-text', 'textbox', 'text'].includes(type?.toLowerCase());
      if (isText(obj.type)) {
        obj.set({ underline: false });
      }

      // Remove hover state from groups
      if (obj.type === 'group') {
        this.applyHoverStateToGroup(obj, false);
      }

      // Remove stroke from frame objects
      if (obj.customMetadata?.type === VariableType.FRAME) {
        obj.set({
          stroke: undefined,
          strokeWidth: 0
        });
      }
    });

    // Remove overlay if exists
    if (this.hoverOverlay) {
      canvas.remove(this.hoverOverlay);
      this.hoverOverlay = null;
    }
  }

  /**
   * Apply hover state to group (button) - modifies stroke directly
   */
  private applyHoverStateToGroup(groupObj: any, isHovered: boolean): void {
    const isText = (type: string) => ['i-text', 'textbox', 'text'].includes(type?.toLowerCase());
    const children = groupObj.getObjects ? groupObj.getObjects() : groupObj._objects || [];

    children.forEach((child: any) => {
      if (isText(child.type)) {
        child.set({
          underline: isHovered,
          stroke: undefined,
          strokeWidth: 0
        });
      } else {
        child.set({
          stroke: isHovered ? '#007AFF' : undefined,
          strokeWidth: isHovered ? 2 : 0,
          strokeUniform: true,
          strokeDashArray: isHovered ? [5, 5] : null
        });
      }
    });
  }
}
