import { Injectable, inject } from '@angular/core';
import { FabricImage, Group, IText, Rect, Textbox } from 'fabric';
import { CanvasStateService } from '../canvas/canvas-state.service';
import {
  ButtonProperties,
  CanvasObjectProperties,
  FrameProperties,
  ImageProperties,
  TextProperties
} from '../../types/canvas-object.type';
import { DEFAULT_IMAGE_URL, VariableType } from '../../consts/variables.const';
import { ObjectPropertiesExtractorService } from './object-properties-extractor.service';
import { ObjectConstraintService } from './object-constraint.service';

@Injectable()
export class ObjectUpdateService {
  private stateService = inject(CanvasStateService);
  private propertiesExtractor = inject(ObjectPropertiesExtractorService);
  private constraintService = inject(ObjectConstraintService);

  updateObjectProperties(properties: Partial<CanvasObjectProperties>, skipRender = false): void {
    const canvas = this.stateService.getCanvas();
    const activeObject = canvas.getActiveObject();

    if (!activeObject) return;

    const type = this.propertiesExtractor.getObjectType(activeObject);

    switch (type) {
      case VariableType.TEXT:
        this.updateTextProperties(activeObject as IText, properties as Partial<TextProperties>);
        break;

      case VariableType.IMAGE:
        this.updateImagePropertiesInternal(
          activeObject as FabricImage,
          properties as Partial<ImageProperties>
        );
        break;

      case VariableType.BUTTON:
        this.updateButtonProperties(activeObject as Group, properties as Partial<ButtonProperties>);
        break;

      case VariableType.FRAME:
        this.updateFrameProperties(activeObject as Rect, properties as Partial<FrameProperties>);
        break;

      default:
        break;
    }

    // Apply frame constraints after update (skip for frame itself)
    if (type !== VariableType.FRAME && this.constraintService.hasFrame()) {
      this.constraintService.applyFrameConstraints(activeObject);
    }

    activeObject.setCoords();

    if (!skipRender) {
      canvas.renderAll();
    }
  }

  updateImageProperties(properties: Partial<ImageProperties>, skipRender = false): void {
    const canvas = this.stateService.getCanvas();
    const activeObject = canvas.getActiveObject();

    if (
      !activeObject ||
      this.propertiesExtractor.getObjectType(activeObject) !== VariableType.IMAGE
    ) {
      return;
    }

    this.updateImagePropertiesInternal(activeObject as FabricImage, properties);

    // Apply frame constraints after update
    if (this.constraintService.hasFrame()) {
      this.constraintService.applyFrameConstraints(activeObject);
    }

    activeObject.setCoords();

    if (!skipRender) {
      canvas.renderAll();
    }
  }

  updateSelectedObject(properties: any): void {
    const canvas = this.stateService.getCanvas();
    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      const type = this.propertiesExtractor.getObjectType(activeObject);

      activeObject.set(properties);

      // Apply frame constraints after update (skip for frame itself)
      if (type !== VariableType.FRAME && this.constraintService.hasFrame()) {
        this.constraintService.applyFrameConstraints(activeObject);
      }

      activeObject.setCoords();
      canvas.renderAll();
    }
  }

  private updateImagePropertiesInternal(
    imageObj: FabricImage,
    properties: Partial<ImageProperties>
  ): void {
    if (properties.position) {
      imageObj.set({
        left: properties.position.x,
        top: properties.position.y,
        angle: properties.position.angle
      });
    }

    if (properties.width !== undefined && properties.height !== undefined) {
      const originalWidth = imageObj.width || 1;
      const originalHeight = imageObj.height || 1;

      imageObj.set({
        scaleX: Number(properties.width) / originalWidth,
        scaleY: Number(properties.height) / originalHeight
      });
    }

    if (properties.cornerRadius !== undefined) {
      const radius = properties.cornerRadius || 0;

      if (radius > 0) {
        const width = imageObj.width || 0;
        const height = imageObj.height || 0;

        const clipPath = new Rect({
          width: width,
          height: height,
          rx: radius,
          ry: radius,
          originX: 'center',
          originY: 'center'
        });

        imageObj.set({ clipPath });
      } else {
        imageObj.set({ clipPath: undefined });
      }
    }

    if (properties.opacity !== undefined) {
      imageObj.set({ opacity: properties.opacity });
    }

    if (properties.attachments !== undefined && properties.attachments.length > 0) {
      const file = properties.attachments[0];

      // Load new image and fit to frame
      imageObj.setSrc(file.fullPathUrl).then(() => {
        // After image loads, fit it to frame if frame exists
        this.fitImageToFrame(imageObj);
        imageObj.canvas?.requestRenderAll();
      });

      imageObj.set('attachments', properties.attachments);
    } else {
      // Reset to default image
      imageObj.set('attachments', []);

      imageObj.setSrc(DEFAULT_IMAGE_URL).then(() => {
        // After default image loads, fit it to frame if frame exists
        this.fitImageToFrame(imageObj);
        imageObj.canvas?.requestRenderAll();
      });
    }

    if (properties.customData?.metadata) {
      imageObj.set('customMetadata', properties.customData.metadata);
    }
  }

  private updateTextProperties(textObj: IText, properties: Partial<TextProperties>): void {
    if (properties.position) {
      textObj.set({
        left: properties.position.x,
        top: properties.position.y,
        angle: properties.position.angle
      });
    }

    if (properties.textColor) {
      textObj.set({ fill: properties.textColor });
    }

    if (properties.fontFamily) {
      textObj.set({ fontFamily: properties.fontFamily });
    }

    if (properties.fontWeight) {
      textObj.set({ fontWeight: properties.fontWeight });
    }

    if (properties.fontSize) {
      textObj.set({ fontSize: properties.fontSize });
    }

    if (properties.textAlignment) {
      textObj.set({ textAlign: properties.textAlignment });
    }

    if (properties.text !== undefined) {
      textObj.set({ text: properties.text });
    }

    if (properties.customData?.colorPreset) {
      textObj.set('colorPreset', Array.from(properties.customData.colorPreset));
    }

    if (properties.customData?.metadata) {
      textObj.set('customMetadata', properties.customData.metadata);
    }
  }

  private updateButtonProperties(groupObj: Group, properties: Partial<ButtonProperties>) {
    const rect = groupObj.getObjects()[0] as Rect;
    const text = groupObj.getObjects()[1] as Textbox;

    if (!rect || !text) return;

    const currentScaleX = groupObj.scaleX || 1;
    const currentScaleY = groupObj.scaleY || 1;

    const actualWidth = (rect.width || 120) * currentScaleX;
    const actualHeight = (rect.height || 40) * currentScaleY;

    if (properties.position) {
      groupObj.set({
        left: properties.position.x,
        top: properties.position.y,
        angle: properties.position.angle
      });
    }

    // Update width/height
    if (properties.width !== undefined || properties.height !== undefined) {
      const newWidth = Number(properties.width) ?? actualWidth;
      const newHeight = Number(properties.height) ?? actualHeight;

      groupObj.set({
        scaleX: 1,
        scaleY: 1
      });

      rect.set({
        width: newWidth,
        height: newHeight,
        left: 0,
        top: 0
      });

      const padding = (groupObj as any).customMetadata?.padding || 32;
      text.set({
        width: newWidth - padding,
        left: 0,
        top: 0
      });
    } else {
      groupObj.set({
        scaleX: 1,
        scaleY: 1
      });

      rect.set({
        width: actualWidth,
        height: actualHeight
      });

      const padding = (groupObj as any).customMetadata?.padding || 32;
      text.set({
        width: actualWidth - padding
      });
    }

    // Update shape
    if (properties.shape) {
      const width = rect.width || 120;
      const height = rect.height || 40;

      let radius = 0;
      if (properties.shape === 'pill') {
        radius = Math.min(width, height) / 2;
      } else if (properties.shape === 'rounded') {
        radius = 4;
      }

      rect.set({ rx: radius, ry: radius });
    }

    // Update style
    if (properties.style) {
      if (properties.style === 'fill') {
        rect.set({
          fill: properties.buttonColor || rect.fill || '#764FDB',
          stroke: undefined,
          strokeWidth: 0
        });
      } else if (properties.style === 'outline') {
        rect.set({
          fill: 'transparent',
          stroke: properties.buttonColor || '#764FDB',
          strokeWidth: 1
        });
      } else {
        rect.set({
          fill: 'transparent',
          stroke: undefined,
          strokeWidth: 0
        });
      }
    }

    if (properties.buttonColor && !properties.style) {
      rect.set({ fill: properties.buttonColor });
    }

    if (properties.textColor) {
      text.set({ fill: properties.textColor });
    }

    if (properties.fontFamily) {
      text.set({ fontFamily: properties.fontFamily });
    }

    if (properties.fontWeight) {
      text.set({ fontWeight: properties.fontWeight });
    }

    if (properties.fontSize) {
      text.set({ fontSize: properties.fontSize });
    }

    if (properties.textAlignment) {
      text.set({ textAlign: properties.textAlignment });
    }

    if (properties.text !== undefined) {
      text.set({ text: properties.text });
    }

    if (properties.link !== undefined) {
      const metadata = (groupObj as any).customMetadata || {};
      metadata.link = properties.link;
      groupObj.set('customMetadata', metadata);
    }

    if (properties.customData?.metadata) {
      groupObj.set('customMetadata', properties.customData.metadata);
    }

    if (properties.customData?.colorPreset) {
      groupObj.set('colorPreset', Array.from(properties.customData.colorPreset));
    }

    if (properties.customData?.bgColorPreset) {
      groupObj.set('bgColorPreset', Array.from(properties.customData.bgColorPreset));
    }

    text.setCoords();
    rect.setCoords();

    groupObj.triggerLayout();
    groupObj.setCoords();
  }

  private updateFrameProperties(activeObject: Rect, properties: Partial<FrameProperties>) {
    if (properties.bgColor) {
      activeObject.set({ fill: properties.bgColor });
    }

    if (properties.customData?.bgColorPreset) {
      activeObject.set('bgColorPreset', Array.from(properties.customData.bgColorPreset));
    }
  }

  private fitImageToFrame(imageObj: FabricImage): void {
    if (!this.constraintService.hasFrame()) {
      return;
    }

    const frameBounds = this.getFrameBounds();
    if (!frameBounds) {
      return;
    }

    const originalWidth = imageObj.width || 1;
    const originalHeight = imageObj.height || 1;

    // Calculate scale to fit image within frame while maintaining aspect ratio
    const scaleX = frameBounds.width / originalWidth;
    const scaleY = frameBounds.height / originalHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate centered position within frame
    const scaledWidth = originalWidth * scale;
    const scaledHeight = originalHeight * scale;
    const left = frameBounds.left + (frameBounds.width - scaledWidth) / 2;
    const top = frameBounds.top + (frameBounds.height - scaledHeight) / 2;

    // Apply new scale and position
    imageObj.set({
      scaleX: scale,
      scaleY: scale,
      left: left,
      top: top
    });

    imageObj.setCoords();
  }

  private getFrameBounds(): { left: number; top: number; width: number; height: number } | null {
    const frameObject = this.stateService.getFrameObject();
    if (!frameObject) return null;

    return {
      left: frameObject.left || 0,
      top: frameObject.top || 0,
      width: (frameObject.width || 0) * (frameObject.scaleX || 1),
      height: (frameObject.height || 0) * (frameObject.scaleY || 1)
    };
  }
}
