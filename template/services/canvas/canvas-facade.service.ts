import { inject, Injectable } from '@angular/core';
import { Canvas, FabricObject } from 'fabric';
import { Observable } from 'rxjs';
import {
  ButtonProperties,
  CanvasObjectProperties,
  FrameProperties,
  ImageProperties
} from '../../types/canvas-object.type';
import { ObjectCreationService } from '../objects/object-creation.service';
import { ObjectUpdateService } from '../objects/object-update.service';
import { CanvasEventHandlerService } from './canvas-event-handler.service';
import { CanvasInitializationService } from './canvas-initialization.service';
import { CanvasStateService } from './canvas-state.service';
import { LayerManagementService } from '../layers/layer-management.service';
import { Layer } from '../../types/layer.type';

@Injectable()
export class CanvasFacadeService {
  private stateService = inject(CanvasStateService);
  private initService = inject(CanvasInitializationService);
  private creationService = inject(ObjectCreationService);
  private updateService = inject(ObjectUpdateService);
  private eventService = inject(CanvasEventHandlerService);
  private layerManagementService = inject(LayerManagementService);

  readonly layers$: Observable<Layer[]>;
  readonly selectedObject$: Observable<FabricObject | null>;
  readonly selectedObjectProperties$: Observable<CanvasObjectProperties | null>;

  constructor() {
    this.selectedObject$ = this.stateService.selectedObject$;
    this.selectedObjectProperties$ = this.stateService.selectedObjectProperties$;
    this.layers$ = this.layerManagementService.layers$;
  }

  // Initialization
  initCanvas(element: HTMLCanvasElement, width: number, height: number): void {
    this.initService.initCanvas(element, width, height);
  }

  disposeCanvas(): void {
    this.initService.disposeCanvas();
  }

  // Object creation
  addFrame(width: number, height: number): void {
    this.creationService.addFrame(width, height);
  }

  addText(text?: string, colorPreset?: Set<string>): void {
    this.creationService.addText(text, colorPreset);
  }

  addImage(src: string): void {
    this.creationService.addImage(src);
  }

  addButton(text?: string): void {
    this.creationService.addButton(text);
  }

  // Object updates
  updateObjectProperties(properties: Partial<CanvasObjectProperties>, skipRender = false): void {
    this.updateService.updateObjectProperties(properties, skipRender);
  }

  updateImageProperties(properties: Partial<ImageProperties>, skipRender = false): void {
    this.updateService.updateImageProperties(properties, skipRender);
  }

  updateButtonProperties(properties: Partial<ButtonProperties>, skipRender = false): void {
    this.updateService.updateObjectProperties(properties, skipRender);
  }

  updateFrameProperties(properties: Partial<FrameProperties>, skipRender = false): void {
    this.updateService.updateObjectProperties(properties, skipRender);
  }

  updateSelectedObject(properties: any): void {
    this.updateService.updateSelectedObject(properties);
  }

  // Queries
  getFrameBounds(): { left: number; top: number; width: number; height: number } | null {
    return this.creationService.getFrameBounds();
  }

  hasFrame(): boolean {
    return this.stateService.hasFrame();
  }

  getCanvasDimensions(): { width: number; height: number } {
    return this.stateService.getCanvasDimensions();
  }

  getCanvas(): Canvas {
    return this.stateService.getCanvas();
  }

  // Events
  emitCurrentObjectProperties(): void {
    this.eventService.emitCurrentObjectProperties();
  }

  // Layer management methods
  syncLayers(): void {
    this.layerManagementService.syncLayers();
  }

  selectLayer(layerId: string): void {
    this.layerManagementService.selectLayer(layerId);
  }

  toggleLayerVisibility(layerId: string): void {
    this.layerManagementService.toggleVisibility(layerId);
  }

  deleteLayer(layerId: string): void {
    this.layerManagementService.deleteLayer(layerId);
  }

  reorderLayers(previousIndex: number, currentIndex: number): void {
    this.layerManagementService.reorderLayers(previousIndex, currentIndex);
  }
}
