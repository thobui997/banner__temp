import { Injectable, inject } from '@angular/core';
import { FabricObject, Group, IText, Rect, Textbox } from 'fabric';
import { UpdateImageSourceCommand } from '../../commands/image-source.command';
import { UpdateMultiObjectPropsCommand } from '../../commands/update-multi-object-props.command';
import { UpdatePropertiesCommand } from '../../commands/update-object.command';
import { DEFAULT_IMAGE_URL, VariableType } from '../../consts/variables.const';
import {
  ButtonProperties,
  CanvasObjectProperties,
  FrameProperties,
  ImageProperties,
  TextProperties
} from '../../types/canvas-object.type';
import { CanvasEventHandlerService } from '../canvas/canvas-event-handler.service';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { CommandManagerService } from '../command/command-manager.service';
import { ObjectPropertiesExtractorService } from './object-properties-extractor.service';

@Injectable()
export class ObjectUpdateService {
  private stateService = inject(CanvasStateService);
  private propertiesExtractor = inject(ObjectPropertiesExtractorService);
  private commandManagerService = inject(CommandManagerService);
  private canvasEventHandlerService = inject(CanvasEventHandlerService);

  updateObjectProperties(properties: Partial<CanvasObjectProperties>): void {
    const canvas = this.stateService.getCanvas();
    const activeObject = canvas.getActiveObject();

    if (!activeObject) return;

    const type = this.propertiesExtractor.getObjectType(activeObject);

    switch (type) {
      case VariableType.TEXT:
        this.updateTextProperties(activeObject as IText, properties as Partial<TextProperties>);
        break;

      case VariableType.IMAGE:
        this.updateImageProperties(activeObject as Rect, properties as Partial<ImageProperties>);
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
  }

  private updateImageProperties(imageRect: Rect, properties: Partial<ImageProperties>): void {
    const canvas = this.stateService.getCanvas();

    // Separate image source changes from other property changes
    const hasImageSourceChange = properties.attachments !== undefined;
    const hasOtherChanges = Object.keys(properties).some(
      (key) => key !== 'attachments' && properties[key as keyof ImageProperties] !== undefined
    );

    // Step 1: Apply OTHER property changes FIRST (if any)
    if (hasOtherChanges) {
      const newProperties: Record<string, any> = {};

      const addProp = (key: string, value: any) => {
        if (value !== undefined) newProperties[key] = value;
      };

      // Update position
      if (properties.position) {
        addProp('left', properties.position.x);
        addProp('top', properties.position.y);
        addProp('angle', properties.position.angle);
      }

      // Update dimensions
      if (properties.width !== undefined && properties.height !== undefined) {
        const originalWidth = imageRect.width || 1;
        const originalHeight = imageRect.height || 1;

        addProp('scaleX', Number(properties.width) / originalWidth);
        addProp('scaleY', Number(properties.height) / originalHeight);
      }

      // Update corner radius - IMPORTANT: This must be applied before image change
      if (properties.cornerRadius !== undefined) {
        const radius = properties.cornerRadius || 0;
        addProp('rx', radius);
        addProp('ry', radius);
      }

      // Update opacity
      if (properties.opacity !== undefined) {
        addProp('opacity', properties.opacity);
      }

      // Update metadata
      if (properties.customData?.metadata) {
        addProp('customMetadata', properties.customData.metadata);
      }

      // Execute property changes command
      if (Object.keys(newProperties).length > 0) {
        const propsCommand = new UpdatePropertiesCommand(canvas, imageRect, newProperties, () => {
          this.canvasEventHandlerService.emitObjectProperties(imageRect);
        });
        this.commandManagerService.execute(propsCommand);
      }
    }

    // Step 2: Then handle image source change (if any)
    // This will capture the CURRENT state (after step 1) as "old state"
    if (hasImageSourceChange) {
      const attachments = properties.attachments ?? [];
      const newSrc = attachments?.length > 0 ? attachments[0].fullPathUrl : DEFAULT_IMAGE_URL;

      const sourceCommand = new UpdateImageSourceCommand(canvas, imageRect, newSrc, attachments, {
        syncForm: () => {
          this.canvasEventHandlerService.emitObjectProperties(imageRect);
        }
      });

      this.commandManagerService.execute(sourceCommand);
    }
  }

  private updateTextProperties(textObj: IText, properties: Partial<TextProperties>): void {
    const canvas = this.stateService.getCanvas();

    const newProperties: Record<string, any> = {};

    const addProp = (key: string, value: any) => {
      if (value !== undefined) {
        newProperties[key] = value;
      }
    };

    const propertyMap = {
      left: properties.position?.x,
      top: properties.position?.y,
      angle: properties.position?.angle,
      fill: properties.textColor,
      fontFamily: properties.fontFamily,
      fontWeight: properties.fontWeight,
      fontSize: properties.fontSize,
      textAlign: properties.textAlignment,
      text: properties.text
    };

    Object.entries(propertyMap).forEach(([key, value]) => addProp(key, value));

    if (properties.customData?.colorPreset) {
      addProp('colorPreset', Array.from(properties.customData.colorPreset));
    }

    if (properties.customData?.metadata) {
      addProp('customMetadata', properties.customData.metadata);
    }

    const command = new UpdatePropertiesCommand(canvas, textObj, newProperties, () => {
      this.canvasEventHandlerService.emitObjectProperties(textObj);
    });

    this.commandManagerService.execute(command);
  }

  private updateButtonProperties(groupObj: Group, properties: Partial<ButtonProperties>) {
    const canvas = this.stateService.getCanvas();
    const rect = groupObj.getObjects()[0] as Rect;
    const text = groupObj.getObjects()[1] as Textbox;

    if (!rect || !text) return;

    const groupProperties: Record<string, any> = {};
    const rectProperties: Record<string, any> = {};
    const textProperties: Record<string, any> = {};

    const addProp = (target: Record<string, any>, key: string, value: any) => {
      if (value !== undefined) {
        target[key] = value;
      }
    };

    // Calculate current actual dimensions
    const currentScaleX = groupObj.scaleX || 1;
    const currentScaleY = groupObj.scaleY || 1;
    const actualWidth = (rect.width || 120) * currentScaleX;
    const actualHeight = (rect.height || 40) * currentScaleY;

    // Update position
    if (properties.position) {
      addProp(groupProperties, 'left', properties.position.x);
      addProp(groupProperties, 'top', properties.position.y);
      addProp(groupProperties, 'angle', properties.position.angle);
    }

    // Update dimensions
    if (properties.width !== undefined || properties.height !== undefined) {
      const newWidth = Number(properties.width) ?? actualWidth;
      const newHeight = Number(properties.height) ?? actualHeight;

      // Reset group scale
      addProp(groupProperties, 'scaleX', 1);
      addProp(groupProperties, 'scaleY', 1);

      // Update rect dimensions
      addProp(rectProperties, 'width', newWidth);
      addProp(rectProperties, 'height', newHeight);
      addProp(rectProperties, 'left', 0);
      addProp(rectProperties, 'top', 0);

      // Update text width with padding
      const padding = (groupObj as any).customMetadata?.padding || 32;
      addProp(textProperties, 'width', newWidth - padding);
      addProp(textProperties, 'left', 0);
      addProp(textProperties, 'top', 0);
    } else if (currentScaleX !== 1 || currentScaleY !== 1) {
      // Normalize scale even if width/height not explicitly changed
      addProp(groupProperties, 'scaleX', 1);
      addProp(groupProperties, 'scaleY', 1);
      addProp(rectProperties, 'width', actualWidth);
      addProp(rectProperties, 'height', actualHeight);

      const padding = (groupObj as any).customMetadata?.padding || 32;
      addProp(textProperties, 'width', actualWidth - padding);
    }

    // Update shape (corner radius)
    if (properties.shape) {
      const width = rectProperties['width'] || rect.width || 120;
      const height = rectProperties['height'] || rect.height || 40;

      let radius = 0;
      if (properties.shape === 'pill') {
        radius = Math.min(width, height) / 2;
      } else if (properties.shape === 'rounded') {
        radius = 4;
      }

      addProp(rectProperties, 'rx', radius);
      addProp(rectProperties, 'ry', radius);
    }

    // Update style
    if (properties.style) {
      if (properties.style === 'fill') {
        addProp(rectProperties, 'fill', properties.buttonColor || rect.fill || '#764FDB');
        addProp(rectProperties, 'stroke', undefined);
        addProp(rectProperties, 'strokeWidth', 0);
      } else if (properties.style === 'outline') {
        addProp(rectProperties, 'fill', 'transparent');
        addProp(rectProperties, 'stroke', properties.buttonColor || '#764FDB');
        addProp(rectProperties, 'strokeWidth', 1);
      } else {
        addProp(rectProperties, 'fill', 'transparent');
        addProp(rectProperties, 'stroke', undefined);
        addProp(rectProperties, 'strokeWidth', 0);
      }
    }

    // Update button color (if style not provided)
    if (properties.buttonColor && !properties.style) {
      addProp(rectProperties, 'fill', properties.buttonColor);
    }

    // Update text properties
    if (properties.textColor) {
      addProp(textProperties, 'fill', properties.textColor);
    }

    if (properties.fontFamily) {
      addProp(textProperties, 'fontFamily', properties.fontFamily);
    }

    if (properties.fontWeight) {
      addProp(textProperties, 'fontWeight', properties.fontWeight);
    }

    if (properties.fontSize) {
      addProp(textProperties, 'fontSize', properties.fontSize);
    }

    if (properties.textAlignment) {
      addProp(textProperties, 'textAlign', properties.textAlignment);
    }

    if (properties.text !== undefined) {
      addProp(textProperties, 'text', properties.text);
    }

    // Update metadata
    if (properties.customData?.metadata) {
      const metadata = { ...(groupObj as any).customMetadata };
      if (properties.customData?.metadata) {
        Object.assign(metadata, properties.customData.metadata);
      }
      addProp(groupProperties, 'customMetadata', metadata);
    }

    if (properties.buttonLink !== undefined) {
      addProp(groupProperties, 'buttonLink', properties.buttonLink);
    }

    // Update color presets
    if (properties.customData?.colorPreset) {
      addProp(groupProperties, 'colorPreset', Array.from(properties.customData.colorPreset));
    }

    if (properties.customData?.bgColorPreset) {
      addProp(groupProperties, 'bgColorPreset', Array.from(properties.customData.bgColorPreset));
    }

    // Check if there are any updates
    if (
      Object.keys(groupProperties).length === 0 &&
      Object.keys(rectProperties).length === 0 &&
      Object.keys(textProperties).length === 0
    ) {
      return;
    }

    // Prepare updates array
    const updates: Array<{ object: FabricObject; properties: Record<string, any> }> = [];

    if (Object.keys(groupProperties).length > 0) {
      updates.push({ object: groupObj, properties: groupProperties });
    }

    if (Object.keys(rectProperties).length > 0) {
      updates.push({ object: rect, properties: rectProperties });
    }

    if (Object.keys(textProperties).length > 0) {
      updates.push({ object: text, properties: textProperties });
    }

    // Execute command
    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandlerService.emitObjectProperties(groupObj);
      },
      afterUpdate: () => {
        groupObj.triggerLayout();
        groupObj.setCoords();
      }
    });

    this.commandManagerService.execute(command);
  }

  private updateFrameProperties(activeObject: Rect, properties: Partial<FrameProperties>) {
    const canvas = this.stateService.getCanvas();

    const newProperties: Record<string, any> = {};

    const addProp = (key: string, value: any) => {
      if (value !== undefined) {
        newProperties[key] = value;
      }
    };

    const propertyMap = {
      fill: properties.bgColor
    };

    Object.entries(propertyMap).forEach(([key, value]) => addProp(key, value));

    if (properties.customData?.bgColorPreset) {
      addProp('bgColorPreset', Array.from(properties.customData.bgColorPreset));
    }

    if (Object.keys(newProperties).length === 0) return;

    const command = new UpdatePropertiesCommand(canvas, activeObject, newProperties, () => {
      this.canvasEventHandlerService.emitObjectProperties(activeObject);
    });
    this.commandManagerService.execute(command);
  }
}
