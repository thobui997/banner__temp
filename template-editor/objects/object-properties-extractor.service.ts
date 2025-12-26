import { Injectable } from '@angular/core';
import { FabricObject, Group, IText, Rect, Textbox } from 'fabric';
import {
  ButtonProperties,
  CanvasObjectProperties,
  FrameProperties,
  ImageProperties,
  Layer,
  TextProperties
} from '../../../types';
import { VariableType } from '../../../consts';

@Injectable()
export class ObjectPropertiesExtractorService {
  extractProperties(obj: FabricObject): CanvasObjectProperties | null {
    const type = this.getObjectType(obj);

    switch (type) {
      case VariableType.TEXT:
        return this.extractTextProperties(obj as IText);
      case VariableType.IMAGE:
        return this.extractImageProperties(obj as Rect);
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

    // Get current selection styles if editing
    const currentStyles = this.getCurrentSelectionStyles(textObj);

    return {
      type: VariableType.TEXT,
      position: {
        x: Math.round(textObj.left || 0),
        y: Math.round(textObj.top || 0),
        angle: Math.round(textObj.angle || 0)
      },
      width: textObj.width || 200,
      textColor: currentStyles?.fill || (textObj.fill as string) || '#000000',
      fontFamily: currentStyles?.fontFamily || textObj.fontFamily || 'Noto Sans',
      fontWeight: currentStyles?.fontWeight || (textObj.fontWeight as number) || 400,
      fontSize: currentStyles?.fontSize || textObj.fontSize || 24,
      textAlignment: (textObj.textAlign as any) || 'left',
      text: textObj.text || '',
      customData: {
        colorPreset: colorPreset,
        metadata: textObj.get('customMetadata') as any,
        selectionStyles: currentStyles
      }
    };
  }

  private extractImageProperties(imageRect: Rect): ImageProperties {
    const cornerRadius = imageRect.rx || 0;

    return {
      type: VariableType.IMAGE,
      position: {
        x: Math.round(imageRect.left || 0),
        y: Math.round(imageRect.top || 0),
        angle: Math.round(imageRect.angle || 0)
      },
      width: (imageRect.width || 0) * (imageRect.scaleX || 1),
      height: (imageRect.height || 0) * (imageRect.scaleY || 1),
      cornerRadius: cornerRadius,
      opacity: imageRect.opacity,
      src: (imageRect.get('imageSrc') as string) || '',
      attachments: (imageRect.get('attachments') as any[]) || [],
      customData: {
        metadata: imageRect.get('customMetadata') as any
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

    // Get button color from metadata first, then fallback to rect properties
    const metadata = groupObj.get('customMetadata') as any;
    let buttonColor = metadata?.originalButtonColor;

    if (!buttonColor) {
      if (style === 'outline') {
        buttonColor = (rect.stroke as string) || '#764FDB';
      } else if (style === 'fill') {
        buttonColor = (rect.fill as string) || '#764FDB';
      } else {
        buttonColor = '#764FDB';
      }
    }

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
      buttonColor: buttonColor,
      textColor: (text.fill as string) || '#FFFFFF',
      fontFamily: text.fontFamily || 'Noto Sans',
      fontWeight: (text.fontWeight as number) || 400,
      fontSize: text.fontSize || 14,
      textAlignment: (text.textAlign as any) || 'center',
      text: text.text || '',
      buttonLink: (groupObj as any).buttonLink || '',
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

  private getCurrentSelectionStyles(textObj: IText | Textbox): {
    fill?: string;
    fontFamily?: string;
    fontWeight?: number;
    fontSize?: number;
    underline?: boolean;
    linethrough?: boolean;
    fontStyle?: string;
  } | null {
    if (!textObj.isEditing) {
      // Not editing, return default object styles
      return {
        fill: textObj.fill as string,
        fontFamily: textObj.fontFamily,
        fontWeight: textObj.fontWeight as number,
        fontSize: textObj.fontSize,
        underline: textObj.underline,
        linethrough: textObj.linethrough,
        fontStyle: textObj.fontStyle
      };
    }

    const selectionStart = textObj.selectionStart ?? 0;
    const selectionEnd = textObj.selectionEnd ?? 0;

    if (selectionStart === selectionEnd) {
      // Cursor position - get style at cursor
      return this.getStyleAtPosition(textObj, selectionStart);
    } else {
      // Has selection - get common styles across selection
      return this.getCommonStylesInRange(textObj, selectionStart, selectionEnd);
    }
  }

  /**
   * Get style at a specific position
   */
  private getStyleAtPosition(textObj: IText | Textbox, position: number): any {
    // If at position 0 or no styles, use default
    if (position === 0 || !textObj.styles) {
      return {
        fill: textObj.fill as string,
        fontFamily: textObj.fontFamily,
        fontWeight: textObj.fontWeight as number,
        fontSize: textObj.fontSize,
        underline: textObj.underline,
        linethrough: textObj.linethrough,
        fontStyle: textObj.fontStyle
      };
    }

    // Get style at position - 1 (the character before cursor)
    const styleAtCursor = textObj.getSelectionStyles(position - 1, position);

    if (styleAtCursor && styleAtCursor.length > 0) {
      const style = styleAtCursor[0];
      return {
        fill: style.fill ?? textObj.fill,
        fontFamily: style.fontFamily ?? textObj.fontFamily,
        fontWeight: style.fontWeight ?? textObj.fontWeight,
        fontSize: style.fontSize ?? textObj.fontSize,
        underline: style.underline ?? textObj.underline,
        linethrough: style.linethrough ?? textObj.linethrough,
        fontStyle: style.fontStyle ?? textObj.fontStyle
      };
    }

    // No style found, use defaults
    return {
      fill: textObj.fill as string,
      fontFamily: textObj.fontFamily,
      fontWeight: textObj.fontWeight as number,
      fontSize: textObj.fontSize,
      underline: textObj.underline,
      linethrough: textObj.linethrough,
      fontStyle: textObj.fontStyle
    };
  }

  /**
   * Get common styles across a selection range
   */
  private getCommonStylesInRange(textObj: IText | Textbox, start: number, end: number): any {
    const styles = textObj.getSelectionStyles(start, end);

    if (!styles || styles.length === 0) {
      return {
        fill: textObj.fill as string,
        fontFamily: textObj.fontFamily,
        fontWeight: textObj.fontWeight as number,
        fontSize: textObj.fontSize,
        underline: textObj.underline,
        linethrough: textObj.linethrough,
        fontStyle: textObj.fontStyle
      };
    }

    // Find common styles across all selected characters
    const firstStyle = styles[0];
    const commonStyles: any = { ...firstStyle };

    // Check each property to see if it's consistent across selection
    for (let i = 1; i < styles.length; i++) {
      const style = styles[i];

      // If property differs, set to undefined (mixed state)
      Object.keys(commonStyles).forEach((key) => {
        if (commonStyles[key] !== style[key as keyof typeof style]) {
          commonStyles[key] = undefined;
        }
      });
    }

    // Fill in defaults for undefined values
    return {
      fill: commonStyles.fill ?? textObj.fill,
      fontFamily: commonStyles.fontFamily ?? textObj.fontFamily,
      fontWeight: commonStyles.fontWeight ?? textObj.fontWeight,
      fontSize: commonStyles.fontSize ?? textObj.fontSize,
      underline: commonStyles.underline ?? textObj.underline,
      linethrough: commonStyles.linethrough ?? textObj.linethrough,
      fontStyle: commonStyles.fontStyle ?? textObj.fontStyle
    };
  }
}
