import { inject, Injectable } from '@angular/core';
import { FabricImage, FabricObject, Group, IText, Rect, Textbox, util } from 'fabric';
import { nanoid } from 'nanoid';
import { VariableType } from '../../consts/variables.const';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { AddObjectCommand } from '../../commands/add-object.command';
import { CommandManagerService } from '../command/command-manager.service';
import { FrameManagementService } from '../frame/frame-management.service';

@Injectable()
export class ObjectCreationService {
  private stateService = inject(CanvasStateService);
  private commandManager = inject(CommandManagerService);
  private frameManagement = inject(FrameManagementService);

  addText(text = 'Text Block', colorPreset?: Set<string>): void {
    const canvas = this.stateService.getCanvas();

    // Get constrained position within frame
    const position = this.frameManagement.getConstrainedPosition(100, 30);

    const textObj = new IText(text, {
      left: position.left,
      top: position.top,
      fontSize: 24,
      fill: '#000000',
      fontFamily: 'Arial',
      fontWeight: 400,
      splitByGrapheme: false,
      colorPreset: colorPreset ? Array.from(colorPreset) : ['#000000'],
      customMetadata: {
        id: this.generateId(),
        createdAt: Date.now(),
        type: VariableType.TEXT
      }
    });

    // Apply frame clipping before adding
    this.frameManagement.applyFrameClipping(textObj);

    const command = new AddObjectCommand(canvas, textObj);
    this.commandManager.execute(command);
  }

  async addImage(src: string) {
    const canvas = this.stateService.getCanvas();

    const imgObj = await FabricImage.fromURL(src, { crossOrigin: 'anonymous' });

    // Get constrained position within frame
    const imgWidth = imgObj.width || 200;
    const imgHeight = imgObj.height || 200;
    const position = this.frameManagement.getConstrainedPosition(imgWidth, imgHeight);

    imgObj.set({
      left: position.left,
      top: position.top,
      scaleX: 1,
      scaleY: 1
    });

    imgObj.set('customMetadata', {
      id: this.generateId(),
      createdAt: Date.now(),
      type: VariableType.IMAGE
    });

    // Apply frame clipping
    this.frameManagement.applyFrameClipping(imgObj);

    const command = new AddObjectCommand(canvas, imgObj);
    this.commandManager.execute(command);
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

    // Get constrained position within frame
    const position = this.frameManagement.getConstrainedPosition(buttonWidth, height);

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

    // Apply frame clipping
    this.frameManagement.applyFrameClipping(groupObj);

    const command = new AddObjectCommand(canvas, groupObj);
    this.commandManager.execute(command);
  }

  private generateId(): string {
    return nanoid();
  }
}
