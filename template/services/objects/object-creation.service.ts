import { inject, Injectable } from '@angular/core';
import { FabricImage, Group, IText, Rect, Textbox } from 'fabric';
import { nanoid } from 'nanoid';
import { VariableType } from '../../consts/variables.const';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { AddObjectCommand } from '../../commands/add-object.command';
import { CommandManagerService } from '../command/command-manager.service';

@Injectable()
export class ObjectCreationService {
  private stateService = inject(CanvasStateService);
  private commandManger = inject(CommandManagerService);

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

    // Get constrained position if frame exists
    const position = { left: 100, top: 100 };

    const textObj = new IText(text, {
      left: position.left,
      top: position.top,
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
    this.commandManger.execute(command);
  }

  async addImage(src: string) {
    const canvas = this.stateService.getCanvas();

    const imgObj = await FabricImage.fromURL(src, { crossOrigin: 'anonymous' });

    imgObj.set({
      left: 200,
      top: 200,
      scaleX: 1,
      scaleY: 1
    });

    imgObj.set('customMetadata', {
      id: this.generateId(),
      createdAt: Date.now(),
      type: VariableType.IMAGE
    });

    const command = new AddObjectCommand(canvas, imgObj);
    this.commandManger.execute(command);
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

    const position = { left: 100, top: 100 };

    const groupObj = new Group([button, buttonText], {
      left: position.left,
      top: position.top,
      subTargetCheck: false,
      interactive: false
    });

    groupObj.set('customMetadata', {
      id: this.generateId(),
      createdAt: Date.now(),
      type: VariableType.BUTTON,
      link: link || '',
      padding: paddingHorizontal,
      minWidth: minWidth,
      height: height
    });

    const bgPresetArray = bgColorPreset ? Array.from(bgColorPreset) : ['#764FDB'];
    groupObj.set('bgColorPreset', bgPresetArray);

    const presetArray = colorPreset ? Array.from(colorPreset) : ['#FFFFFF'];
    groupObj.set('colorPreset', presetArray);

    const command = new AddObjectCommand(canvas, groupObj);
    this.commandManger.execute(command);
  }

  private generateId(): string {
    return nanoid();
  }
}
