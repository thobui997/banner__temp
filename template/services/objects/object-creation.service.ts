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

  /**
   * Add text object to canvas
   * Text position is constrained within frame if exists
   */
  addText(text = 'Text Block', colorPreset?: Set<string>): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    // Calculate text dimensions
    const fontSize = 24;
    const estimatedWidth = text.length * fontSize * 0.6; // Rough estimate
    const estimatedHeight = fontSize * 1.5;

    // Get constrained position if frame exists
    const position = this.constraintService.hasFrame()
      ? this.constraintService.getConstrainedCreationPosition(
          estimatedWidth,
          estimatedHeight,
          100,
          100
        )
      : { left: 100, top: 100 };

    const textObj = new IText(text, {
      left: position.left,
      top: position.top,
      fontSize: fontSize,
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

    // Add with command pattern for undo/redo
    const command = new AddObjectCommand(canvas, textObj);
    this.commandManager.executeCommand(command);

    // Set as active and render
    canvas.setActiveObject(textObj);
    canvas.requestRenderAll();
  }

  /**
   * Add image from URL or Data URL
   * Supports both external URLs and base64 data URLs
   *
   * @param src - Image URL or Data URL (base64)
   */
  addImage(src: string): void {
    const canvas = this.stateService.getCanvas();

    FabricImage.fromURL(src).then((img) => {
      this.configureAndAddImage(img, canvas);
    }).catch((error) => {
      console.error('Error loading image:', error);
    });
  }

  /**
   * Add image from File object (local upload)
   * Convert File to Data URL then add to canvas
   *
   * @param file - File object from input[type="file"]
   */
  addImageFromFile(file: File): void {
    const canvas = this.stateService.getCanvas();

    // Convert file to Data URL
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const dataUrl = event.target?.result as string;

      if (dataUrl) {
        FabricImage.fromURL(dataUrl).then((img) => {
          this.configureAndAddImage(img, canvas);
        }).catch((error) => {
          console.error('Error loading image from file:', error);
        });
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
    };

    reader.readAsDataURL(file);
  }

  /**
   * Configure image position, scale, and add to canvas
   * DRY: Extracted common logic from addImage and addImageFromFile
   *
   * @param img - FabricImage object
   * @param canvas - Canvas instance
   */
  private configureAndAddImage(img: FabricImage, canvas: any): void {
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

    // Set custom metadata
    img.set('customMetadata', {
      id: this.generateId(),
      createdAt: Date.now(),
      type: VariableType.IMAGE
    });

    // Add to canvas with command pattern for undo/redo
    const command = new AddObjectCommand(canvas, img);
    this.commandManager.executeCommand(command);

    // Set as active object
    canvas.setActiveObject(img);
    canvas.renderAll();
  }

  /**
   * Add button object to canvas
   * Button position is constrained within frame if exists
   * Uses command pattern for undo/redo support
   */
  addButton(
    text = 'Click Here',
    link?: string,
    colorPreset?: Set<string>,
    bgColorPreset?: Set<string>
  ): void {
    const canvas = this.stateService.getCanvas();
    if (!canvas) return;

    const minWidth = 120;
    const paddingHorizontal = 32;
    const height = 40;

    // Create button text
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

    // Create button background
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

    // Create button group
    const group = new Group([button, buttonText], {
      left: position.left,
      top: position.top,
      subTargetCheck: false,
      interactive: false
    });

    // Set metadata
    group.set('customMetadata', {
      id: this.generateId(),
      createdAt: Date.now(),
      type: VariableType.BUTTON,
      link: link || '',
      padding: paddingHorizontal,
      minWidth: minWidth,
      height: height
    });

    // Set color presets
    const bgPresetArray = bgColorPreset ? Array.from(bgColorPreset) : ['#764FDB'];
    group.set('bgColorPreset', bgPresetArray);

    const presetArray = colorPreset ? Array.from(colorPreset) : ['#FFFFFF'];
    group.set('colorPreset', presetArray);

    // Add to canvas with command pattern for undo/redo
    const command = new AddObjectCommand(canvas, group);
    this.commandManager.executeCommand(command);

    // Set as active object
    canvas.setActiveObject(group);
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
