import { inject, Injectable } from '@angular/core';
import { FabricImage, Group, IText, Rect, Textbox } from 'fabric';
import { nanoid } from 'nanoid';
import { VariableType } from '../../consts/variables.const';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { ObjectConstraintService } from './object-constraint.service';
import { CommandManagerService } from '../command/command-manager.service';
import { AddObjectCommand } from '../../commands/add-object.command';

@Injectable()
export class ObjectCreationService {
  private stateService = inject(CanvasStateService);
  private constraintService = inject(ObjectConstraintService);
  private commandManager = inject(CommandManagerService);

  addFrame(width: number, height: number): void {
    const canvas = this.stateService.getCanvas();
    const canvasWidth = canvas.width || 0;
    const canvasHeight = canvas.height || 0;

    const left = (canvasWidth - width) / 2;
    const top = (canvasHeight - height) / 2;

    const frame = new Rect({
      left: left,
      top: top,
      width: width,
      height: height,
      fill: '#FFFFFF',
      lockRotation: true
    });

    frame.set('customMetadata', {
      id: this.generateId(),
      createdAt: Date.now(),
      type: VariableType.FRAME
    });

    this.stateService.updateFrameObject(frame);

    canvas.add(frame);
    canvas.sendObjectToBack(frame);
    canvas.renderAll();
  }

  addText(text = 'Text Block', colorPreset?: Set<string>): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const textObj = new IText(text, {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: '#000000',
      fontFamily: 'Arial',
      fontWeight: 400
    });

    const presetArray = colorPreset ? Array.from(colorPreset) : ['#000000'];
    textObj.set('colorPreset', presetArray);

    textObj.set('customMetadata', {
      id: this.generateId(),
      createdAt: Date.now(),
      type: VariableType.TEXT
    });

    const command = new AddObjectCommand(canvas, textObj);
    this.commandManager.executeCommand(command);
  }

  addImage(src: string): void {
    const canvas = this.stateService.getCanvas();

    FabricImage.fromURL(src).then((img) => {
      const originalWidth = img.width || 1;
      const originalHeight = img.height || 1;

      // If frame exists, fit image to frame
      if (this.constraintService.hasFrame()) {
        const frameBounds = this.getFrameBounds();

        if (frameBounds) {
          // Calculate scale to fit image within frame while maintaining aspect ratio
          const scaleX = frameBounds.width / originalWidth;
          const scaleY = frameBounds.height / originalHeight;
          const scale = Math.min(scaleX, scaleY);

          // Calculate centered position within frame
          const scaledWidth = originalWidth * scale;
          const scaledHeight = originalHeight * scale;
          const left = frameBounds.left + (frameBounds.width - scaledWidth) / 2;
          const top = frameBounds.top + (frameBounds.height - scaledHeight) / 2;

          img.set({
            left: left,
            top: top,
            scaleX: scale,
            scaleY: scale
          });
        }
      } else {
        // No frame, use default position
        img.set({
          left: 200,
          top: 200,
          scaleX: 1,
          scaleY: 1
        });
      }

      img.set('customMetadata', {
        id: this.generateId(),
        createdAt: Date.now(),
        type: VariableType.IMAGE
      });

      canvas.add(img);
      canvas.bringObjectToFront(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  }

  addButton(
    text = 'Click Here',
    link?: string,
    colorPreset?: Set<string>,
    bgColorPreset?: Set<string>
  ) {
    const canvas = this.stateService.getCanvas();

    const minWidth = 120;
    const paddingHorizontal = 32;
    const height = 40;

    const buttonText = new Textbox(text, {
      fontSize: 14,
      fill: '#FFFFFF',
      fontFamily: 'Arial',
      fontWeight: 400,
      textAlign: 'center',
      width: minWidth - paddingHorizontal,
      splitByGrapheme: true,
      originX: 'center',
      originY: 'center'
    });

    const textWidth = buttonText.getBoundingRect().width;
    const buttonWidth = Math.max(minWidth, textWidth + paddingHorizontal);

    const button = new Rect({
      left: 0,
      top: 0,
      width: buttonWidth,
      height: height,
      fill: '#764FDB',
      rx: 4,
      ry: 4,
      originX: 'center',
      originY: 'center'
    });

    buttonText.set({
      left: 0,
      top: 0
    });

    // Get constrained position if frame exists
    const position = this.constraintService.hasFrame()
      ? this.constraintService.getConstrainedCreationPosition(buttonWidth, height, 100, 100)
      : { left: 100, top: 100 };

    const group = new Group([button, buttonText], {
      left: position.left,
      top: position.top,
      subTargetCheck: false,
      interactive: false
    });

    group.set('customMetadata', {
      id: this.generateId(),
      createdAt: Date.now(),
      type: VariableType.BUTTON,
      link: link || '',
      padding: paddingHorizontal,
      minWidth: minWidth,
      height: height
    });

    const bgPresetArray = bgColorPreset ? Array.from(bgColorPreset) : ['#764FDB'];
    group.set('bgColorPreset', bgPresetArray);

    const presetArray = colorPreset ? Array.from(colorPreset) : ['#FFFFFF'];
    group.set('colorPreset', presetArray);

    canvas.add(group);
    canvas.bringObjectToFront(group);
    canvas.setActiveObject(group);

    // Apply constraints after adding to canvas
    if (this.constraintService.hasFrame()) {
      this.constraintService.applyFrameConstraints(group);
    }

    canvas.requestRenderAll();
  }

  getFrameBounds(): { left: number; top: number; width: number; height: number } | null {
    const frameObject = this.stateService.getFrameObject();

    if (!frameObject) {
      return null;
    }

    return {
      left: frameObject.left || 0,
      top: frameObject.top || 0,
      width: frameObject.width ? frameObject.width * frameObject.scaleX : 0,
      height: frameObject.height ? frameObject.height * frameObject.scaleY : 0
    };
  }

  private generateId(): string {
    return nanoid();
  }
}
