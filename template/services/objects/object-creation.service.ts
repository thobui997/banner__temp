import { inject, Injectable } from '@angular/core';
import { FabricImage, Group, IText, Rect, Textbox } from 'fabric';
import { nanoid } from 'nanoid';
import { AddObjectCommand } from '../../commands/add-object.command';
import { VariableType } from '../../consts/variables.const';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { CommandManagerService } from '../command/command-manager.service';
import { FrameManagementService } from '../frame/frame-management.service';
import { LayerManagementService } from '../layers/layer-management.service';

@Injectable()
export class ObjectCreationService {
  private stateService = inject(CanvasStateService);
  private commandManager = inject(CommandManagerService);
  private frameManagement = inject(FrameManagementService);
  private layerManagement = inject(LayerManagementService);

  private layerCounters = {
    text: 0,
    image: 0,
    button: 0
  };

  addText(text = 'Text Block', colorPreset?: Set<string>): void {
    const canvas = this.stateService.getCanvas();

    // Get constrained position within frame
    const position = this.frameManagement.getConstrainedPosition(100, 30);

    this.layerCounters.text++;
    const layerName = `Text ${this.layerCounters.text}`;

    const textObj = new IText(text, {
      left: position.left,
      top: position.top,
      fontSize: 24,
      fill: '#000000',
      fontFamily: 'Arial',
      fontWeight: 400,
      splitByGrapheme: false,
      lockScalingFlip: true,
      lockScalingX: true,
      lockScalingY: true,
      lockSkewingX: true,
      lockSkewingY: true,
      colorPreset: colorPreset ? Array.from(colorPreset) : ['#000000'],
      customMetadata: {
        id: this.generateId(),
        createdAt: Date.now(),
        type: VariableType.TEXT,
        customName: layerName
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

    this.layerCounters.image++;
    const layerName = `Image ${this.layerCounters.image}`;

    // Set custom metadata
    imgObj.set('customMetadata', {
      id: this.generateId(),
      createdAt: Date.now(),
      type: VariableType.IMAGE,
      customName: layerName
    });

    // Fit image to frame
    this.fitImageToFrame(imgObj);

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
      fill: '#005AA9',
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

    this.layerCounters.button++;
    const layerName = `Button ${this.layerCounters.button}`;

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
      height: height,
      customName: layerName
    });

    const bgPresetArray = bgColorPreset ? Array.from(bgColorPreset) : ['#005AA9'];
    groupObj.set('bgColorPreset', bgPresetArray);

    const presetArray = colorPreset ? Array.from(colorPreset) : ['#FFFFFF'];
    groupObj.set('colorPreset', presetArray);

    // Apply frame clipping
    this.frameManagement.applyFrameClipping(groupObj);

    const command = new AddObjectCommand(canvas, groupObj);
    this.commandManager.execute(command);
  }

  resetCounters(): void {
    this.layerCounters = {
      text: 0,
      image: 0,
      button: 0
    };
  }

  syncCountersFromLayers(): void {
    const layers = this.layerManagement.getLayers();

    // Reset counters
    this.resetCounters();

    layers.forEach((layer) => {
      if (layer.name.startsWith('Text ')) {
        const num = parseInt(layer.name.replace('Text ', ''));
        if (!isNaN(num) && num > this.layerCounters.text) {
          this.layerCounters.text = num;
        }
      } else if (layer.name.startsWith('Image ')) {
        const num = parseInt(layer.name.replace('Image ', ''));
        if (!isNaN(num) && num > this.layerCounters.image) {
          this.layerCounters.image = num;
        }
      } else if (layer.name.startsWith('Button ')) {
        const num = parseInt(layer.name.replace('Button ', ''));
        if (!isNaN(num) && num > this.layerCounters.button) {
          this.layerCounters.button = num;
        }
      }
    });
  }

  /**
   * Fit image to frame while maintaining aspect ratio
   * Centers the image within the frame
   */
  private fitImageToFrame(imageObj: FabricImage): void {
    const frameBounds = this.getFrameBounds();

    if (!frameBounds) {
      // No frame, use default position
      imageObj.set({
        left: 100,
        top: 100,
        scaleX: 1,
        scaleY: 1
      });
      imageObj.setCoords();
      return;
    }

    const originalWidth = imageObj.width || 1;
    const originalHeight = imageObj.height || 1;

    // Calculate scale to fit image within frame while maintaining aspect ratio
    const scaleX = frameBounds.width / originalWidth;
    const scaleY = frameBounds.height / originalHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate centered position within frame
    const scaledWidth = originalWidth * scale;
    const scaledHeight = originalHeight * scale;
    const left = frameBounds.left + (frameBounds.width - scaledWidth) / 2;
    const top = frameBounds.top + (frameBounds.height - scaledHeight) / 2;

    // Apply new scale and position
    imageObj.set({
      scaleX: scale,
      scaleY: scale,
      left: left,
      top: top
    });

    imageObj.setCoords();
  }

  /**
   * Get frame bounds helper
   */
  private getFrameBounds(): { left: number; top: number; width: number; height: number } | null {
    const frameObject = this.stateService.getFrameObject();
    if (!frameObject) return null;

    return {
      left: frameObject.left || 0,
      top: frameObject.top || 0,
      width: (frameObject.width || 0) * (frameObject.scaleX || 1),
      height: (frameObject.height || 0) * (frameObject.scaleY || 1)
    };
  }

  private generateId(): string {
    return nanoid();
  }
}
