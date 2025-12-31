import { inject, Injectable } from '@angular/core';
import { FabricObject, IText, Textbox } from 'fabric';
import { UpdatePropertiesCommand } from '../../../commands/template-editor-commands/update-object.command';
import { Position, TextAlignment } from '../../../types';
import { CanvasEventHandlerService } from '../canvas/canvas-event-handler.service';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { CommandManagerService } from '../command/command-manager.service';
import { UpdateTextSelectionStylesCommand } from '../../../commands/template-editor-commands/update-text-selection-styles.command';
import { UpdateFontCommand } from '../../../commands/template-editor-commands/update-font.command';

@Injectable()
export class TextUpdateService {
  private stateService = inject(CanvasStateService);
  private commandManager = inject(CommandManagerService);
  private canvasEventHandler = inject(CanvasEventHandlerService);

  /**
   * Update text position (x, y, angle)
   */
  updatePosition(textObj: FabricObject, position: Partial<Position>): void {
    const canvas = this.stateService.getCanvas();
    const changedProps: Record<string, any> = {};

    if (position.x !== undefined) {
      const newX = Number(position.x);
      if (!isNaN(newX) && textObj.left !== newX) {
        changedProps['left'] = newX;
      }
    }

    if (position.y !== undefined) {
      const newY = Number(position.y);
      if (!isNaN(newY) && textObj.top !== newY) {
        changedProps['top'] = newY;
      }
    }

    if (position.angle !== undefined) {
      const newAngle = Number(position.angle);
      if (!isNaN(newAngle) && textObj.angle !== newAngle) {
        changedProps['angle'] = newAngle;
      }
    }

    if (Object.keys(changedProps).length === 0) return;

    const command = new UpdatePropertiesCommand(canvas, textObj, changedProps, () => {
      this.canvasEventHandler.emitObjectProperties(textObj);
    });

    this.commandManager.execute(command);
  }

  /**
   * Update text color
   */
  updateColor(textObj: IText | Textbox, color: string): void {
    const canvas = this.stateService.getCanvas();
    const selectionRange = this.getSelectionRange(textObj);

    if (selectionRange) {
      // Apply color to selection only using new command
      const command = new UpdateTextSelectionStylesCommand(
        canvas,
        textObj,
        { fill: color },
        selectionRange,
        () => {
          this.canvasEventHandler.emitObjectProperties(textObj);
        }
      );

      this.commandManager.execute(command);
    } else {
      // Apply to entire text
      if (textObj.fill === color) return;

      const command = new UpdatePropertiesCommand(canvas, textObj, { fill: color }, () => {
        this.canvasEventHandler.emitObjectProperties(textObj);
      });

      this.commandManager.execute(command);
    }
  }

  async updateFont(
    textObj: IText | Textbox,
    font: {
      fontFamily?: string;
      fontWeight?: number;
      fontSize?: number;
    }
  ): Promise<void> {
    const canvas = this.stateService.getCanvas();
    const selectionRange = this.getSelectionRange(textObj);

    if (selectionRange) {
      // Apply font to selection only
      const styles: Record<string, any> = {};

      if (font.fontFamily !== undefined) {
        styles['fontFamily'] = font.fontFamily;
      }

      if (font.fontWeight !== undefined) {
        styles['fontWeight'] = font.fontWeight;
      }

      if (font.fontSize !== undefined) {
        styles['fontSize'] = font.fontSize;
      }

      if (Object.keys(styles).length === 0) return;

      const command = new UpdateTextSelectionStylesCommand(
        canvas,
        textObj,
        styles,
        selectionRange,
        () => {
          this.canvasEventHandler.emitObjectProperties(textObj);
        }
      );

      this.commandManager.execute(command);
    } else {
      const hasChanges =
        (font.fontFamily !== undefined && textObj.fontFamily !== font.fontFamily) ||
        (font.fontWeight !== undefined && textObj.fontWeight !== font.fontWeight) ||
        (font.fontSize !== undefined && textObj.fontSize !== font.fontSize);

      if (!hasChanges) return;

      const hasFontChange =
        (font.fontFamily !== undefined && textObj.fontFamily !== font.fontFamily) ||
        (font.fontWeight !== undefined && textObj.fontWeight !== font.fontWeight);

      if (hasFontChange) {
        const command = new UpdateFontCommand(
          canvas,
          textObj,
          font.fontFamily ?? textObj.fontFamily,
          font.fontWeight ?? textObj.fontWeight,
          font.fontSize,
          () => {
            this.canvasEventHandler.emitObjectProperties(textObj);
          }
        );

        this.commandManager.execute(command);
      } else {
        const command = new UpdatePropertiesCommand(
          canvas,
          textObj,
          { fontSize: font.fontSize },
          () => {
            this.canvasEventHandler.emitObjectProperties(textObj);
          }
        );

        this.commandManager.execute(command);
      }
    }
  }

  /**
   * Update text alignment
   */
  updateAlignment(textObj: IText | Textbox, alignment: TextAlignment): void {
    const canvas = this.stateService.getCanvas();

    if (textObj.textAlign === alignment) return;

    // Disable caching
    textObj.objectCaching = false;

    const command = new UpdatePropertiesCommand(canvas, textObj, { textAlign: alignment }, () => {
      textObj.initDimensions();
      textObj.setCoords();
      textObj.dirty = true;

      requestAnimationFrame(() => {
        textObj.objectCaching = true;
        canvas.requestRenderAll();
      });

      this.canvasEventHandler.emitObjectProperties(textObj);
    });

    this.commandManager.execute(command);
  }

  /**
   * Update text content
   */
  updateContent(textObj: IText | Textbox, text: string): void {
    const canvas = this.stateService.getCanvas();

    if (textObj.text === text) return;

    // Disable caching
    textObj.objectCaching = false;

    const command = new UpdatePropertiesCommand(canvas, textObj, { text }, () => {
      textObj.initDimensions();
      textObj.setCoords();
      textObj.dirty = true;

      requestAnimationFrame(() => {
        textObj.objectCaching = true;
        canvas.requestRenderAll();
      });

      this.canvasEventHandler.emitObjectProperties(textObj);
    });

    this.commandManager.execute(command);
  }

  /**
   * Update color preset
   */
  updateColorPreset(textObj: FabricObject, colorPreset: Set<string>): void {
    const canvas = this.stateService.getCanvas();
    const currentPreset = textObj.get('colorPreset') as string[] | undefined;
    const newPreset = Array.from(colorPreset);

    if (JSON.stringify(currentPreset) === JSON.stringify(newPreset)) return;

    const command = new UpdatePropertiesCommand(canvas, textObj, { colorPreset: newPreset }, () => {
      this.canvasEventHandler.emitObjectProperties(textObj);
    });

    this.commandManager.execute(command);
  }

  /**
   * Update metadata
   */
  updateMetadata(textObj: FabricObject, metadata: any): void {
    const canvas = this.stateService.getCanvas();
    const currentMetadata = textObj.get('customMetadata');

    if (JSON.stringify(currentMetadata) === JSON.stringify(metadata)) return;

    const command = new UpdatePropertiesCommand(
      canvas,
      textObj,
      { customMetadata: metadata },
      () => {
        this.canvasEventHandler.emitObjectProperties(textObj);
      }
    );

    this.commandManager.execute(command);
  }

  /**
   * Check if text has selection (highlighted text)
   */
  private hasTextSelection(textObj: IText | Textbox): boolean {
    return (
      textObj.isEditing &&
      textObj.selectionStart !== undefined &&
      textObj.selectionEnd !== undefined &&
      textObj.selectionStart !== textObj.selectionEnd
    );
  }

  /**
   * Get selection range
   */
  private getSelectionRange(textObj: IText | Textbox): { start: number; end: number } | null {
    if (!this.hasTextSelection(textObj)) return null;

    return {
      start: textObj.selectionStart,
      end: textObj.selectionEnd
    };
  }
}
