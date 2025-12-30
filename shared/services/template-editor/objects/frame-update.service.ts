import { inject, Injectable } from '@angular/core';
import { Rect } from 'fabric';
import { UpdatePropertiesCommand } from '../../../commands/template-editor-commands/update-object.command';
import { CanvasEventHandlerService } from '../canvas/canvas-event-handler.service';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { CommandManagerService } from '../command/command-manager.service';

@Injectable()
export class FrameUpdateService {
  private stateService = inject(CanvasStateService);
  private commandManager = inject(CommandManagerService);
  private canvasEventHandler = inject(CanvasEventHandlerService);

  /**
   * Update frame background color
   */
  updateBackgroundColor(frame: Rect, color: string): void {
    const canvas = this.stateService.getCanvas();

    if (frame.fill === color) return;

    const command = new UpdatePropertiesCommand(canvas, frame, { fill: color }, () => {
      this.canvasEventHandler.emitObjectProperties(frame);
    });

    this.commandManager.execute(command);
  }

  /**
   * Update background color preset
   */
  updateBgColorPreset(frame: Rect, bgColorPreset: Set<string>): void {
    const canvas = this.stateService.getCanvas();
    const currentPreset = frame.get('bgColorPreset') as string[] | undefined;
    const newPreset = Array.from(bgColorPreset);

    if (JSON.stringify(currentPreset) === JSON.stringify(newPreset)) return;

    const command = new UpdatePropertiesCommand(canvas, frame, { bgColorPreset: newPreset }, () => {
      this.canvasEventHandler.emitObjectProperties(frame);
    });

    this.commandManager.execute(command);
  }

  /**
   * Update metadata
   */
  updateMetadata(frame: Rect, metadata: any): void {
    const canvas = this.stateService.getCanvas();
    const currentMetadata = frame.get('customMetadata');
    const mergedMetadata = { ...currentMetadata, ...metadata };

    if (JSON.stringify(currentMetadata) === JSON.stringify(mergedMetadata)) return;

    const command = new UpdatePropertiesCommand(
      canvas,
      frame,
      { customMetadata: mergedMetadata },
      () => {
        this.canvasEventHandler.emitObjectProperties(frame);
      }
    );

    this.commandManager.execute(command);
  }
}
