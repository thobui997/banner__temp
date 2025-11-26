import { inject, Injectable } from '@angular/core';
import { Canvas, FabricObject } from 'fabric';
import { Observable } from 'rxjs';
import {
  ButtonProperties,
  CanvasObjectProperties,
  FrameProperties,
  ImageProperties
} from '../../types/canvas-object.type';
import { Layer } from '../../types/layer.type';
import { FrameManagementService } from '../frame/frame-management.service';
import { FrameRatioService } from '../frame/frame-ratio.service';
import { LayerManagementService } from '../layers/layer-management.service';
import { ObjectCreationService } from '../objects/object-creation.service';
import { ObjectDeserializerService } from '../objects/object-deserializer.service';
import { ObjectUpdateService } from '../objects/object-update.service';
import { CanvasEventHandlerService } from './canvas-event-handler.service';
import { CanvasInitializationService } from './canvas-initialization.service';
import { CanvasStateService } from './canvas-state.service';
import { CanvasZoomService, ZoomState } from './canvas-zoom.service';

@Injectable()
export class CanvasFacadeService {
  private stateService = inject(CanvasStateService);
  private initService = inject(CanvasInitializationService);
  private creationService = inject(ObjectCreationService);
  private updateService = inject(ObjectUpdateService);
  private eventService = inject(CanvasEventHandlerService);
  private layerManagementService = inject(LayerManagementService);
  private frameManagement = inject(FrameManagementService);
  private deserializer = inject(ObjectDeserializerService);
  private ratioService = inject(FrameRatioService);
  private zoomService = inject(CanvasZoomService);

  readonly layers$: Observable<Layer[]>;
  readonly selectedObject$: Observable<FabricObject | null>;
  readonly selectedObjectProperties$: Observable<CanvasObjectProperties | null>;
  readonly currentRatio$: Observable<number>;
  readonly zoomState$: Observable<ZoomState>;

  constructor() {
    this.selectedObject$ = this.stateService.selectedObject$;
    this.selectedObjectProperties$ = this.stateService.selectedObjectProperties$;
    this.layers$ = this.layerManagementService.layers$;
    this.currentRatio$ = this.ratioService.currentRatio$;
    this.zoomState$ = this.zoomService.zoomState$;
  }

  // Initialization
  initCanvas(element: HTMLCanvasElement, width: number, height: number): void {
    this.initService.initCanvas(element, width, height);
  }

  initializeFrame(width: number, height: number, ratioValue?: number): void {
    const canvas = this.stateService.getCanvas();
    const frame = this.frameManagement.initializeFrame(width, height);

    canvas.add(frame);
    canvas.sendObjectToBack(frame);
    canvas.setActiveObject(frame);
    canvas.requestRenderAll();

    // Initialize ratio service with the frame's ratio
    if (ratioValue !== undefined) {
      this.ratioService['currentRatioSubject'].next(ratioValue);
    } else {
      this.ratioService.initializeRatioFromFrame();
    }
  }

  disposeCanvas(): void {
    this.initService.disposeCanvas();
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
  updateObjectProperties(properties: Partial<CanvasObjectProperties>): void {
    this.updateService.updateObjectProperties(properties);
  }

  updateImageProperties(properties: Partial<ImageProperties>): void {
    this.updateService.updateObjectProperties(properties);
  }

  updateButtonProperties(properties: Partial<ButtonProperties>): void {
    this.updateService.updateObjectProperties(properties);
  }

  updateFrameProperties(properties: Partial<FrameProperties>): void {
    this.updateService.updateObjectProperties(properties);
  }

  // Queries
  getFrameBounds(): { left: number; top: number; width: number; height: number } | null {
    return this.stateService.getFrameBounds();
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

  // Ratio management
  changeFrameRatio(ratioValue: number): void {
    this.ratioService.changeRatio(ratioValue);
  }

  getCurrentRatio(): number {
    return this.ratioService.getCurrentRatio();
  }

  // Zoom methods
  zoomIn(): void {
    this.zoomService.zoomIn();
  }

  zoomOut(): void {
    this.zoomService.zoomOut();
  }

  resetZoom(): void {
    this.zoomService.resetZoom();
  }

  zoomToFit(): void {
    this.zoomService.zoomToFit();
  }

  setZoom(zoom: number): void {
    this.zoomService.setZoom(zoom);
  }

  getCurrentZoom(): number {
    return this.zoomService.getCurrentZoom();
  }

  getZoomPercentage(): number {
    return this.zoomService.getZoomPercentage();
  }

  exportTemplateToJson() {
    const canvas = this.stateService.getCanvas();
    const objects = canvas.toObject([
      'colorPreset',
      'bgColorPreset',
      'attachments',
      'customMetadata',
      'clipPath',
      'stroke',
      'strokeWidth',
      'borderColor',
      'cornerStyle',
      'cornerColor',
      'transparentCorners',
      'cornerSize',
      'lockRotation',
      'lockScalingFlip'
    ]);

    return JSON.stringify(objects);
  }

  generateThumbnailBlob(size = 300): Promise<Blob> {
    const canvas = this.stateService.getCanvas();
    const frame = this.stateService.getFrameObject();

    return new Promise((resolve, reject) => {
      if (!frame) {
        reject(new Error('No frame found'));
        return;
      }

      try {
        const frameBounds = frame.getBoundingRect();
        const scale = size / frameBounds.width;

        const dataURL = canvas.toDataURL({
          left: frameBounds.left,
          top: frameBounds.top,
          width: frameBounds.width,
          height: frameBounds.height,
          multiplier: scale,
          format: 'jpeg',
          quality: 1,
          enableRetinaScaling: false
        });

        fetch(dataURL)
          .then((res) => res.blob())
          .then((blob) => resolve(blob))
          .catch((err) => reject(err));
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateThumbnailFile(size = 300, fileName?: string): Promise<File> {
    const blob = await this.generateThumbnailBlob(size);
    const name = fileName || `thumbnail-${Date.now()}.jpeg`;
    return new File([blob], name, { type: 'image/jpeg' });
  }

  async loadTemplateFromJson(jsonData: string) {
    const canvas = this.stateService.getCanvas();

    // Clear canvas first (optional)
    const objects = canvas.getObjects();
    objects.forEach((obj) => canvas.remove(obj));

    // Deserialize and add objects
    const data = jsonData ? JSON.parse(jsonData) : {};
    await this.deserializer.deserializeAndAddObjects(data);

    // Initialize ratio from loaded frame
    this.ratioService.initializeRatioFromFrame();

    // Sync layers
    this.syncLayers();

    canvas.requestRenderAll();
  }

  resizeCanvas(width: number, height: number): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    canvas.setDimensions({
      width: width,
      height: height
    });

    canvas.renderAll();
  }
}
