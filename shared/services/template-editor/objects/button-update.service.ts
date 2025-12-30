import { inject, Injectable } from '@angular/core';
import { FabricObject, Group, Rect, Textbox } from 'fabric';
import { UpdateMultiObjectPropsCommand } from '../../../commands/template-editor-commands/update-multi-object-props.command';
import { ButtonShape, ButtonStyle, Position, TextAlignment } from '../../../types';
import { CanvasEventHandlerService } from '../canvas/canvas-event-handler.service';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { CommandManagerService } from '../command/command-manager.service';

@Injectable()
export class ButtonUpdateService {
  private stateService = inject(CanvasStateService);
  private commandManager = inject(CommandManagerService);
  private canvasEventHandler = inject(CanvasEventHandlerService);

  /**
   * Update button position (x, y, angle)
   */
  updatePosition(groupObj: Group, position: Partial<Position>): void {
    const canvas = this.stateService.getCanvas();
    const changedProps: Record<string, any> = {};

    if (position.x !== undefined) {
      const newX = Number(position.x);
      if (!isNaN(newX) && groupObj.left !== newX) {
        changedProps['left'] = newX;
      }
    }

    if (position.y !== undefined) {
      const newY = Number(position.y);
      if (!isNaN(newY) && groupObj.top !== newY) {
        changedProps['top'] = newY;
      }
    }

    if (position.angle !== undefined) {
      const newAngle = Number(position.angle);
      if (!isNaN(newAngle) && groupObj.angle !== newAngle) {
        changedProps['angle'] = newAngle;
      }
    }

    if (Object.keys(changedProps).length === 0) return;

    const updates = [{ object: groupObj, properties: changedProps }];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      },
      afterUpdate: () => {
        groupObj.setCoords();
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update button size (width, height)
   */
  updateSize(
    groupObj: Group,
    size: {
      width?: number;
      height?: number;
    }
  ): void {
    const canvas = this.stateService.getCanvas();
    const rect = groupObj.getObjects()[0] as Rect;
    const text = groupObj.getObjects()[1] as Textbox;

    if (!rect || !text) return;

    const currentScaleX = groupObj.scaleX || 1;
    const currentScaleY = groupObj.scaleY || 1;
    const actualWidth = (rect.width || 120) * currentScaleX;
    const actualHeight = (rect.height || 40) * currentScaleY;

    const newWidth = size.width !== undefined ? Number(size.width) : actualWidth;
    const newHeight = size.height !== undefined ? Number(size.height) : actualHeight;

    // Check if size actually changed
    if (Math.abs(newWidth - actualWidth) < 0.1 && Math.abs(newHeight - actualHeight) < 0.1) {
      return;
    }

    const padding = (groupObj as any).customMetadata?.padding || 32;

    const updates: Array<{ object: FabricObject; properties: Record<string, any> }> = [
      {
        object: groupObj,
        properties: {
          scaleX: 1,
          scaleY: 1
        }
      },
      {
        object: rect,
        properties: {
          width: newWidth,
          height: newHeight,
          left: 0,
          top: 0
        }
      },
      {
        object: text,
        properties: {
          width: newWidth - padding,
          left: 0,
          top: 0
        }
      }
    ];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      },
      afterUpdate: () => {
        groupObj.triggerLayout();
        groupObj.setCoords();
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update button shape (rectangle, rounded, pill)
   */
  updateShape(groupObj: Group, shape: ButtonShape): void {
    const canvas = this.stateService.getCanvas();
    const rect = groupObj.getObjects()[0] as Rect;

    if (!rect) return;

    const width = rect.width || 120;
    const height = rect.height || 40;

    let radius = 0;
    if (shape === 'pill') {
      radius = Math.min(width, height) / 2;
    } else if (shape === 'rounded') {
      radius = 4;
    }

    // Check if radius actually changed
    if (rect.rx === radius && rect.ry === radius) return;

    const updates = [
      {
        object: rect,
        properties: {
          rx: radius,
          ry: radius
        }
      }
    ];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      },
      afterUpdate: () => {
        groupObj.triggerLayout();
        groupObj.setCoords();
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update button style (fill, outline, text)
   */
  updateStyle(groupObj: Group, style: ButtonStyle, buttonColor?: string): void {
    const canvas = this.stateService.getCanvas();
    const rect = groupObj.getObjects()[0] as Rect;

    if (!rect) return;

    const metadata = groupObj.get('customMetadata') as any;
    let originalColor = metadata?.originalButtonColor;

    if (!originalColor) {
      if (rect.fill && rect.fill !== 'transparent') {
        originalColor = rect.fill as string;
      } else if (rect.stroke) {
        originalColor = rect.stroke as string;
      } else {
        originalColor = buttonColor || '#764FDB';
      }
    }

    const color = buttonColor || originalColor;
    const rectProps: Record<string, any> = {};

    if (style === 'fill') {
      rectProps['fill'] = color;
      rectProps['stroke'] = undefined;
      rectProps['strokeWidth'] = 0;
    } else if (style === 'outline') {
      rectProps['fill'] = 'transparent';
      rectProps['stroke'] = color;
      rectProps['strokeWidth'] = 1;
    } else {
      rectProps['fill'] = 'transparent';
      rectProps['stroke'] = null;
      rectProps['strokeWidth'] = 0;
    }

    // Check if properties actually changed
    const currentFill = rect.fill;
    const currentStroke = rect.stroke;
    const currentStrokeWidth = rect.strokeWidth;

    if (
      currentFill === rectProps['fill'] &&
      currentStroke === rectProps['stroke'] &&
      currentStrokeWidth === rectProps['strokeWidth']
    ) {
      return;
    }

    // Store original color in metadata
    const updatedMetadata = { ...metadata, originalButtonColor: color };

    const updates = [
      { object: rect, properties: rectProps },
      { object: groupObj, properties: { customMetadata: updatedMetadata } }
    ];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      },
      afterUpdate: () => {
        groupObj.triggerLayout();
        groupObj.setCoords();
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update button color
   */
  updateButtonColor(groupObj: Group, color: string): void {
    const canvas = this.stateService.getCanvas();
    const rect = groupObj.getObjects()[0] as Rect;

    if (!rect) return;

    // Check current style to determine how to apply color
    const isOutline = rect.fill === 'transparent' && rect.stroke;
    const isTextOnly = rect.fill === 'transparent' && !rect.stroke;

    if (isTextOnly) return; // Don't change color for text-only style

    const rectProps: Record<string, any> = {};

    if (isOutline) {
      rectProps['stroke'] = color;
    } else {
      rectProps['fill'] = color;
    }

    // Update metadata to store original color
    const metadata = groupObj.get('customMetadata') as any;
    const updatedMetadata = { ...metadata, originalButtonColor: color };

    const updates = [
      { object: rect, properties: rectProps },
      { object: groupObj, properties: { customMetadata: updatedMetadata } }
    ];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      },
      afterUpdate: () => {
        groupObj.triggerLayout();
        groupObj.setCoords();
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update text color
   */
  updateTextColor(groupObj: Group, color: string): void {
    const canvas = this.stateService.getCanvas();
    const text = groupObj.getObjects()[1] as Textbox;

    if (!text || text.fill === color) return;

    const updates = [{ object: text, properties: { fill: color } }];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      },
      afterUpdate: () => {
        groupObj.triggerLayout();
        groupObj.setCoords();
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update text font properties (family, weight, size)
   */
  updateTextFont(
    groupObj: Group,
    font: {
      fontFamily?: string;
      fontWeight?: number;
      fontSize?: number;
    }
  ): void {
    const canvas = this.stateService.getCanvas();
    const text = groupObj.getObjects()[1] as Textbox;

    if (!text) return;

    const changedProps: Record<string, any> = {};

    if (font.fontFamily !== undefined && text.fontFamily !== font.fontFamily) {
      changedProps['fontFamily'] = font.fontFamily;
    }

    if (font.fontWeight !== undefined && text.fontWeight !== font.fontWeight) {
      changedProps['fontWeight'] = font.fontWeight;
    }

    if (font.fontSize !== undefined && text.fontSize !== font.fontSize) {
      changedProps['fontSize'] = font.fontSize;
    }

    if (Object.keys(changedProps).length === 0) return;

    const updates = [{ object: text, properties: changedProps }];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      },
      afterUpdate: () => {
        groupObj.triggerLayout();
        groupObj.setCoords();
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update text alignment
   */
  updateTextAlignment(groupObj: Group, alignment: TextAlignment): void {
    const canvas = this.stateService.getCanvas();
    const text = groupObj.getObjects()[1] as Textbox;

    if (!text || text.textAlign === alignment) return;

    const updates = [{ object: text, properties: { textAlign: alignment } }];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      },
      afterUpdate: () => {
        groupObj.triggerLayout();
        groupObj.setCoords();
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update text content
   */
  updateTextContent(groupObj: Group, text: string): void {
    const canvas = this.stateService.getCanvas();
    const textObj = groupObj.getObjects()[1] as Textbox;

    if (!textObj || textObj.text === text) return;

    const updates = [{ object: textObj, properties: { text } }];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      },
      afterUpdate: () => {
        groupObj.triggerLayout();
        groupObj.setCoords();
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update button link
   */
  updateButtonLink(groupObj: Group, link: string): void {
    const canvas = this.stateService.getCanvas();
    const currentLink = (groupObj as any).buttonLink;

    if (currentLink === link) return;

    const updates = [{ object: groupObj, properties: { buttonLink: link } }];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update text color preset
   */
  updateTextColorPreset(groupObj: Group, colorPreset: Set<string>): void {
    const canvas = this.stateService.getCanvas();
    const currentPreset = groupObj.get('colorPreset') as string[] | undefined;
    const newPreset = Array.from(colorPreset);

    if (JSON.stringify(currentPreset) === JSON.stringify(newPreset)) return;

    const updates = [{ object: groupObj, properties: { colorPreset: newPreset } }];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update background color preset
   */
  updateBgColorPreset(groupObj: Group, bgColorPreset: Set<string>): void {
    const canvas = this.stateService.getCanvas();
    const currentPreset = groupObj.get('bgColorPreset') as string[] | undefined;
    const newPreset = Array.from(bgColorPreset);

    if (JSON.stringify(currentPreset) === JSON.stringify(newPreset)) return;

    const updates = [{ object: groupObj, properties: { bgColorPreset: newPreset } }];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      }
    });

    this.commandManager.execute(command);
  }

  /**
   * Update metadata
   */
  updateMetadata(groupObj: Group, metadata: any): void {
    const canvas = this.stateService.getCanvas();
    const currentMetadata = groupObj.get('customMetadata');
    const mergedMetadata = { ...currentMetadata, ...metadata };

    if (JSON.stringify(currentMetadata) === JSON.stringify(mergedMetadata)) return;

    const updates = [{ object: groupObj, properties: { customMetadata: mergedMetadata } }];

    const command = new UpdateMultiObjectPropsCommand(canvas, updates, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(groupObj);
      }
    });

    this.commandManager.execute(command);
  }
}
