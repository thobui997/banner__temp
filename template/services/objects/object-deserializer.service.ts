// template/services/objects/object-deserializer.service.ts

import { inject, Injectable } from '@angular/core';
import { FabricImage, FabricObject, Group, IText, Rect, Textbox } from 'fabric';
import { VariableType } from '../../consts/variables.const';
import { CanvasStateService } from '../canvas/canvas-state.service';

@Injectable()
export class ObjectDeserializerService {
  private stateService = inject(CanvasStateService);

  /**
   * Deserialize and add objects from JSON
   */
  async deserializeAndAddObjects(jsonData: any): Promise<void> {
    const canvas = this.stateService.getCanvas();
    if (!canvas || !jsonData.objects) return;

    // Process each object
    for (const objData of jsonData.objects) {
      try {
        const fabricObj = await this.deserializeObject(objData);

        if (fabricObj) {
          // Add to canvas
          canvas.add(fabricObj);

          // Special handling for frame
          const metadata = fabricObj.get('customMetadata') as any;
          if (metadata?.type === VariableType.FRAME) {
            this.stateService.updateFrameObject(fabricObj);
            canvas.sendObjectToBack(fabricObj);
          }
        }
      } catch (error) {
        console.error('Error deserializing object:', objData, error);
      }
    }

    canvas.requestRenderAll();
  }

  /**
   * Deserialize single object
   */
  private async deserializeObject(objData: any): Promise<FabricObject | null> {
    switch (objData.type) {
      case 'IText':
      case 'i-text':
        return this.deserializeText(objData);

      case 'Image':
      case 'image':
        return await this.deserializeImage(objData);

      case 'Group':
      case 'group':
        return await this.deserializeGroup(objData);

      case 'Rect':
      case 'rect':
        return this.deserializeRect(objData);

      default:
        console.warn('Unknown object type:', objData.type);
        return null;
    }
  }

  /**
   * Deserialize IText
   */
  private deserializeText(objData: any): IText {
    // Extract custom properties before creating object
    const colorPreset = objData.colorPreset;
    const customMetadata = objData.customMetadata;

    // Create IText with standard properties
    const textObj = new IText(objData.text || '', {
      left: objData.left,
      top: objData.top,
      fontSize: objData.fontSize || 24,
      fontFamily: objData.fontFamily || 'Arial, sans-serif',
      fontWeight: objData.fontWeight || 400,
      fontStyle: objData.fontStyle,
      fill: objData.fill || '#000000',
      textAlign: objData.textAlign || 'left',
      angle: objData.angle || 0,
      scaleX: objData.scaleX || 1,
      scaleY: objData.scaleY || 1,
      opacity: objData.opacity !== undefined ? objData.opacity : 1,
      visible: objData.visible !== false,
      flipX: objData.flipX || false,
      flipY: objData.flipY || false,
      // Add other properties as needed
      lineHeight: objData.lineHeight,
      charSpacing: objData.charSpacing,
      underline: objData.underline,
      overline: objData.overline,
      linethrough: objData.linethrough,
      lockScalingX: true,
      lockScalingY: true,
      lockScalingFlip: true,
      lockSkewingX: true,
      lockSkewingY: true
    });

    if (colorPreset) {
      textObj.set('colorPreset', colorPreset);
    }

    if (customMetadata) {
      textObj.set('customMetadata', customMetadata);
    }
    if (objData.clipPath) {
      const clipPath = this.deserializeClipPath(objData.clipPath);
      if (clipPath) {
        textObj.set('clipPath', clipPath);
      }
    }

    return textObj;
  }

  /**
   * Deserialize FabricImage
   */
  private async deserializeImage(objData: any): Promise<FabricImage> {
    const attachments = objData.attachments;
    const customMetadata = objData.customMetadata;

    // Create image from URL
    const imgObj = await FabricImage.fromURL(objData.src, {
      crossOrigin: 'anonymous'
    });

    // Set properties
    imgObj.set({
      left: objData.left,
      top: objData.top,
      scaleX: objData.scaleX || 1,
      scaleY: objData.scaleY || 1,
      angle: objData.angle || 0,
      opacity: objData.opacity !== undefined ? objData.opacity : 1,
      visible: objData.visible !== false,
      flipX: objData.flipX || false,
      flipY: objData.flipY || false
    });

    if (attachments) {
      imgObj.set('attachments', attachments);
    }

    if (customMetadata) {
      imgObj.set('customMetadata', customMetadata);
    }

    if (objData.clipPath) {
      const clipPath = this.deserializeClipPath(objData.clipPath);
      if (clipPath) {
        imgObj.set('clipPath', clipPath);
      }
    }

    return imgObj;
  }

  /**
   * Deserialize Group (Button)
   */
  private async deserializeGroup(objData: any): Promise<Group> {
    const colorPreset = objData.colorPreset;
    const bgColorPreset = objData.bgColorPreset;
    const customMetadata = objData.customMetadata;

    // Deserialize child objects
    const childObjects: FabricObject[] = [];

    if (objData.objects && Array.isArray(objData.objects)) {
      for (const childData of objData.objects) {
        if (childData.type === 'Rect' || childData.type === 'rect') {
          const rect = this.deserializeRect(childData);
          childObjects.push(rect);
        } else if (childData.type === 'Textbox' || childData.type === 'textbox') {
          const textbox = this.deserializeTextbox(childData);
          childObjects.push(textbox);
        }
      }
    }

    // Create group
    const group = new Group(childObjects, {
      left: objData.left,
      top: objData.top,
      angle: objData.angle || 0,
      scaleX: objData.scaleX || 1,
      scaleY: objData.scaleY || 1,
      opacity: objData.opacity !== undefined ? objData.opacity : 1,
      visible: objData.visible !== false,
      flipX: objData.flipX || false,
      flipY: objData.flipY || false,
      subTargetCheck: false,
      interactive: false
    });

    if (colorPreset) {
      group.set('colorPreset', colorPreset);
    }

    if (bgColorPreset) {
      group.set('bgColorPreset', bgColorPreset);
    }

    if (customMetadata) {
      group.set('customMetadata', customMetadata);
    }

    return group;
  }

  /**
   * Deserialize Rect
   */
  private deserializeRect(objData: any): Rect {
    const rect = new Rect({
      ...objData
    });

    return rect;
  }

  /**
   * Deserialize Textbox
   */
  private deserializeTextbox(objData: any): Textbox {
    const textbox = new Textbox(objData.text || '', {
      left: objData.left,
      top: objData.top,
      width: objData.width,
      fontSize: objData.fontSize || 14,
      fontFamily: objData.fontFamily || 'Arial, sans-serif',
      fontWeight: objData.fontWeight || 400,
      fill: objData.fill || '#FFFFFF',
      textAlign: objData.textAlign || 'center',
      originX: objData.originX || 'center',
      originY: objData.originY || 'center',
      splitByGrapheme: objData.splitByGrapheme
    });

    return textbox;
  }

  /**
   * Deserialize ClipPath
   */
  private deserializeClipPath(clipData: any): Rect | null {
    if (!clipData) return null;

    return new Rect({
      left: clipData.left,
      top: clipData.top,
      width: clipData.width,
      height: clipData.height,
      rx: clipData.rx || 0,
      ry: clipData.ry || 0,
      fill: clipData.fill || 'transparent',
      stroke: clipData.stroke || 'transparent',
      absolutePositioned: clipData.absolutePositioned,
      inverted: clipData.inverted,
      originX: clipData.originX || 'center',
      originY: clipData.originY || 'center'
    });
  }
}
