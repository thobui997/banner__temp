import { Injectable } from '@angular/core';
import { FabricObject, FabricImage, IText, Rect, Group, Textbox } from 'fabric';
import {
  ButtonProperties,
  CanvasObjectProperties,
  FrameProperties,
  ImageProperties,
  TextProperties
} from '../../types/canvas-object.type';
import { VariableType } from '../../consts/variables.const';
import { Layer } from '../../types/layer.type';

@Injectable()
export class ObjectPropertiesExtractorService {
  extractProperties(obj: FabricObject): CanvasObjectProperties | null {
    const type = this.getObjectType(obj);

    switch (type) {
      case VariableType.TEXT:
        return this.extractTextProperties(obj as IText);
      case VariableType.IMAGE:
        return this.extractImageProperties(obj as FabricImage);
      case VariableType.BUTTON:
        return this.extractButtonProperties(obj as Group);
      case VariableType.FRAME:
        return this.extractFrameProperties(obj as Rect);
      default:
        return null;
    }
  }

  getObjectType(obj: FabricObject): Layer['type'] {
    const type = obj.get('customMetadata')?.type;
    return type || 'shape';
  }

  private extractTextProperties(textObj: IText): TextProperties {
    const colorPresetArray = textObj.get('colorPreset') as string[] | undefined;
    const colorPreset = colorPresetArray ? new Set(colorPresetArray) : new Set(['#000000']);

    return {
      type: VariableType.TEXT,
      position: {
        x: Math.round(textObj.left || 0),
        y: Math.round(textObj.top || 0),
        angle: Math.round(textObj.angle || 0)
      },
      textColor: (textObj.fill as string) || '#000000',
      fontFamily: textObj.fontFamily || 'Noto Sans',
      fontWeight: (textObj.fontWeight as number) || 400,
      fontSize: textObj.fontSize || 24,
      textAlignment: (textObj.textAlign as any) || 'left',
      text: textObj.text || '',
      customData: {
        colorPreset: colorPreset,
        metadata: textObj.get('customMetadata') as any
      }
    };
  }

  private extractImageProperties(imageObj: FabricImage): ImageProperties {
    let cornerRadius = 0;
    const clipPath = imageObj.clipPath;

    if (clipPath && clipPath instanceof Rect) {
      cornerRadius = clipPath.rx || 0;
    }

    return {
      type: VariableType.IMAGE,
      position: {
        x: Math.round(imageObj.left || 0),
        y: Math.round(imageObj.top || 0),
        angle: Math.round(imageObj.angle || 0)
      },
      width: (imageObj.width || 0) * (imageObj.scaleX || 1),
      height: (imageObj.height || 0) * (imageObj.scaleY || 1),
      cornerRadius: cornerRadius,
      opacity: imageObj.opacity,
      src: imageObj.getSrc(),
      attachments: (imageObj.get('attachments') as any[]) || [],
      customData: {
        metadata: imageObj.get('customMetadata') as any
      }
    };
  }

  private extractButtonProperties(groupObj: Group): ButtonProperties {
    const rect = groupObj.getObjects()[0] as Rect;
    const text = groupObj.getObjects()[1] as Textbox;

    const groupScaleX = groupObj.scaleX || 1;
    const groupScaleY = groupObj.scaleY || 1;

    let shape: 'rectangle' | 'rounded' | 'pill' = 'rectangle';
    const rx = rect.rx || 0;
    if (rx >= 16) shape = 'pill';
    else if (rx > 0) shape = 'rounded';

    let style: 'fill' | 'outline' | 'text' = 'fill';
    if (rect.fill === 'transparent' && rect.stroke) style = 'outline';
    else if (rect.fill === 'transparent' && !rect.stroke) style = 'text';

    const colorPresetArray = groupObj.get('colorPreset') as string[] | undefined;
    const colorPreset = colorPresetArray ? new Set(colorPresetArray) : new Set(['#000000']);

    const bgColorPresetArray = groupObj.get('bgColorPreset') as string[] | undefined;
    const bgColorPreset = bgColorPresetArray ? new Set(bgColorPresetArray) : new Set(['#000000']);

    return {
      type: VariableType.BUTTON,
      position: {
        x: Math.round(groupObj.left || 0),
        y: Math.round(groupObj.top || 0),
        angle: Math.round(groupObj.angle || 0)
      },
      width: Math.round((rect.width || 120) * groupScaleX),
      height: Math.round((rect.height || 32) * groupScaleY),
      shape,
      style,
      buttonColor: (rect.fill as string) || '#764FDB',
      textColor: (text.fill as string) || '#FFFFFF',
      fontFamily: text.fontFamily || 'Noto Sans',
      fontWeight: (text.fontWeight as number) || 400,
      fontSize: text.fontSize || 14,
      textAlignment: (text.textAlign as any) || 'center',
      text: text.text || '',
      link: (groupObj as any).buttonLink || '',
      customData: {
        colorPreset: colorPreset,
        bgColorPreset: bgColorPreset,
        metadata: groupObj.get('customMetadata') as any
      }
    };
  }

  private extractFrameProperties(rect: Rect): FrameProperties {
    const bgColorPresetArray = rect.get('bgColorPreset') as string[] | undefined;
    const bgColorPreset = bgColorPresetArray ? new Set(bgColorPresetArray) : new Set(['#FFFFFF']);

    return {
      type: VariableType.FRAME,
      bgColor: (rect.fill as string) || '#FFFFFF',
      customData: {
        bgColorPreset: bgColorPreset,
        metadata: rect.get('customMetadata') as any
      }
    };
  }
}
