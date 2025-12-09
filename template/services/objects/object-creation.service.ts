import { inject, Injectable } from '@angular/core';
import { FabricImage, Group, IText, Rect, Textbox, Pattern } from 'fabric';
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
    const position = this.frameManagement.getConstrainedPosition(200, 50);

    this.layerCounters.text++;
    const layerName = `Text ${this.layerCounters.text}`;

    const textObj = new Textbox(text, {
      left: position.left,
      top: position.top,
      width: 150,
      fontSize: 24,
      fill: '#000000',
      fontFamily: 'Roboto',
      fontWeight: 400,
      splitByGrapheme: true,
      lockScalingFlip: true,
      lockScalingX: false,
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

    // Load image first
    const imgElement = await FabricImage.fromURL(src, { crossOrigin: 'anonymous' });

    this.layerCounters.image++;
    const layerName = `Image ${this.layerCounters.image}`;

    // Create a rectangle that will hold the image as pattern
    const imageRect = new Rect({
      width: imgElement.width || 200,
      height: imgElement.height || 200,
      rx: 0,
      ry: 0,
      originX: 'left',
      originY: 'top'
    });

    // Apply the image as pattern fill
    const pattern = new Pattern({
      source: imgElement.getElement(),
      repeat: 'no-repeat'
    });

    imageRect.set('fill', pattern);

    // Set custom metadata
    imageRect.set('customMetadata', {
      id: this.generateId(),
      createdAt: Date.now(),
      type: VariableType.IMAGE,
      customName: layerName
    });

    // Store image source and attachments
    imageRect.set('imageSrc', src);
    imageRect.set('attachments', []);

    // Fit image to frame
    this.fitImageToFrame(imageRect);

    // Apply frame clipping
    this.frameManagement.applyFrameClipping(imageRect);

    const command = new AddObjectCommand(canvas, imageRect);
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
  private fitImageToFrame(imageRect: Rect): void {
    const frameBounds = this.getFrameBounds();

    if (!frameBounds) {
      // No frame, use default position
      imageRect.set({
        left: 100,
        top: 100,
        scaleX: 1,
        scaleY: 1
      });
      imageRect.setCoords();
      return;
    }

    const originalWidth = imageRect.width || 1;
    const originalHeight = imageRect.height || 1;

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
    imageRect.set({
      scaleX: scale,
      scaleY: scale,
      left: left,
      top: top
    });

    imageRect.setCoords();
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
