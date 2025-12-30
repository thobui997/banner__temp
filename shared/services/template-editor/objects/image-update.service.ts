import { inject, Injectable } from '@angular/core';
import { Rect } from 'fabric';
import { UpdateImageSourceCommand } from '../../../commands';
import { UpdatePropertiesCommand } from '../../../commands/template-editor-commands/update-object.command';
import { DEFAULT_IMAGE_URL } from '../../../consts';
import { Position } from '../../../types';
import { CanvasEventHandlerService } from '../canvas/canvas-event-handler.service';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { CommandManagerService } from '../command/command-manager.service';

@Injectable()
export class ImageUpdateService {
  private stateService = inject(CanvasStateService);
  private commandManager = inject(CommandManagerService);
  private canvasEventHandler = inject(CanvasEventHandlerService);

  /**
   * Update image position (x, y, angle)
   */
  updatePosition(imageRect: Rect, position: Partial<Position>): void {
    const canvas = this.stateService.getCanvas();
    const changedProps: Record<string, any> = {};

    if (position.x !== undefined) {
      const newX = Number(position.x);
      if (!isNaN(newX) && imageRect.left !== newX) {
        changedProps['left'] = newX;
      }
    }

    if (position.y !== undefined) {
      const newY = Number(position.y);
      if (!isNaN(newY) && imageRect.top !== newY) {
        changedProps['top'] = newY;
      }
    }

    if (position.angle !== undefined) {
      const newAngle = Number(position.angle);
      if (!isNaN(newAngle) && imageRect.angle !== newAngle) {
        changedProps['angle'] = newAngle;
      }
    }

    if (Object.keys(changedProps).length === 0) return;

    const command = new UpdatePropertiesCommand(canvas, imageRect, changedProps, () => {
      this.canvasEventHandler.emitObjectProperties(imageRect);
    });

    this.commandManager.execute(command);
  }

  /**
   * Update image size (width, height)
   */
  updateSize(
    imageRect: Rect,
    size: {
      width?: number;
      height?: number;
    }
  ): void {
    const canvas = this.stateService.getCanvas();
    const changedProps: Record<string, any> = {};

    const originalWidth = imageRect.width || 1;
    const originalHeight = imageRect.height || 1;

    if (size.width !== undefined) {
      const newWidth = Number(size.width);
      if (!isNaN(newWidth)) {
        const newScaleX = newWidth / originalWidth;
        const currentScaleX = imageRect.scaleX || 1;
        if (Math.abs(newScaleX - currentScaleX) > 0.001) {
          changedProps['scaleX'] = newScaleX;
        }
      }
    }

    if (size.height !== undefined) {
      const newHeight = Number(size.height);
      if (!isNaN(newHeight)) {
        const newScaleY = newHeight / originalHeight;
        const currentScaleY = imageRect.scaleY || 1;
        if (Math.abs(newScaleY - currentScaleY) > 0.001) {
          changedProps['scaleY'] = newScaleY;
        }
      }
    }

    if (Object.keys(changedProps).length === 0) return;

    const command = new UpdatePropertiesCommand(canvas, imageRect, changedProps, () => {
      this.canvasEventHandler.emitObjectProperties(imageRect);
    });

    this.commandManager.execute(command);
  }

  /**
   * Update corner radius
   */
  updateCornerRadius(imageRect: Rect, radius: number): void {
    const canvas = this.stateService.getCanvas();
    const newRadius = Number(radius) || 0;

    if (imageRect.rx === newRadius && imageRect.ry === newRadius) return;

    const command = new UpdatePropertiesCommand(
      canvas,
      imageRect,
      {
        rx: newRadius,
        ry: newRadius
      },
      () => {
        this.canvasEventHandler.emitObjectProperties(imageRect);
      }
    );

    this.commandManager.execute(command);
  }

  /**
   * Update opacity
   */
  updateOpacity(imageRect: Rect, opacity: number): void {
    const canvas = this.stateService.getCanvas();
    const newOpacity = Number(opacity);

    if (isNaN(newOpacity) || imageRect.opacity === newOpacity) return;

    const command = new UpdatePropertiesCommand(canvas, imageRect, { opacity: newOpacity }, () => {
      this.canvasEventHandler.emitObjectProperties(imageRect);
    });

    this.commandManager.execute(command);
  }

  /**
   * Update image source from attachments
   */
  updateSource(imageRect: Rect, attachments: any): void {
    const canvas = this.stateService.getCanvas();
    const newSrc = attachments?.length > 0 ? attachments[0].fullPathUrl : DEFAULT_IMAGE_URL;

    const sourceCommand = new UpdateImageSourceCommand(canvas, imageRect, newSrc, attachments, {
      syncForm: () => {
        this.canvasEventHandler.emitObjectProperties(imageRect);
      }
    });

    this.commandManager.execute(sourceCommand);
  }

  /**
   * Update metadata
   */
  updateMetadata(imageRect: Rect, metadata: any): void {
    const canvas = this.stateService.getCanvas();
    const currentMetadata = imageRect.get('customMetadata');

    if (JSON.stringify(currentMetadata) === JSON.stringify(metadata)) return;

    const command = new UpdatePropertiesCommand(
      canvas,
      imageRect,
      { customMetadata: metadata },
      () => {
        this.canvasEventHandler.emitObjectProperties(imageRect);
      }
    );

    this.commandManager.execute(command);
  }
}
