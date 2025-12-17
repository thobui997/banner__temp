import { inject, Injectable } from '@angular/core';
import { FabricObject, IText, Textbox } from 'fabric';
import { UpdatePropertiesCommand } from '../../../commands/template-editor-commands/update-object.command';
import { Position, TextAlignment } from '../../../types';
import { CanvasEventHandlerService } from '../canvas/canvas-event-handler.service';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { CommandManagerService } from '../command/command-manager.service';

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
  updateColor(textObj: FabricObject, color: string): void {
    const canvas = this.stateService.getCanvas();

    if (textObj.fill === color) return;

    const command = new UpdatePropertiesCommand(canvas, textObj, { fill: color }, () => {
      this.canvasEventHandler.emitObjectProperties(textObj);
    });

    this.commandManager.execute(command);
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
    const changedProps: Record<string, any> = {};

    if (font.fontFamily !== undefined && textObj.fontFamily !== font.fontFamily) {
      changedProps['fontFamily'] = font.fontFamily;
    }

    if (font.fontWeight !== undefined && textObj.fontWeight !== font.fontWeight) {
      changedProps['fontWeight'] = font.fontWeight;
    }

    if (font.fontSize !== undefined && textObj.fontSize !== font.fontSize) {
      changedProps['fontSize'] = font.fontSize;
    }

    if (Object.keys(changedProps).length === 0) return;


    // Now apply the changes - font is guaranteed to be loaded
    const command = new UpdatePropertiesCommand(canvas, textObj, changedProps, () => {
      this.canvasEventHandler.emitObjectProperties(textObj);
    });

    this.commandManager.execute(command);
  }


  /**
   * Update text alignment
   */
  updateAlignment(textObj: IText | Textbox, alignment: TextAlignment): void {
    const canvas = this.stateService.getCanvas();

    if (textObj.textAlign === alignment) return;

    const command = new UpdatePropertiesCommand(canvas, textObj, { textAlign: alignment }, () => {
      textObj.initDimensions();
      textObj.setCoords();
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

    const command = new UpdatePropertiesCommand(canvas, textObj, { text }, () => {
      textObj.initDimensions();
      textObj.setCoords();
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}