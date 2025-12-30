import { Canvas, FabricImage, Rect, Pattern } from 'fabric';
import { Command } from '../../types';

export class UpdateImageSourceCommand extends Command {
  private oldSrc: string;
  private oldAttachments: any;
  private oldWidth: number;
  private oldHeight: number;
  private oldScaleX: number;
  private oldScaleY: number;
  private oldLeft: number;
  private oldTop: number;
  private oldOpacity: number;
  private oldCornerRadius: number;

  // Store new properties at construction time
  private newWidth = 0;
  private newHeight = 0;

  private syncForm?: () => void;

  constructor(
    private canvas: Canvas,
    private imageRect: Rect,
    private newSrc: string,
    private newAttachments: any,
    options?: {
      syncForm?: () => void;
    }
  ) {
    super();

    // Store old values - BEFORE any changes
    this.oldSrc = imageRect.get('imageSrc') as string;
    this.oldAttachments = imageRect.get('attachments');
    this.oldWidth = imageRect.width || 0;
    this.oldHeight = imageRect.height || 0;
    this.oldScaleX = imageRect.scaleX || 1;
    this.oldScaleY = imageRect.scaleY || 1;
    this.oldLeft = imageRect.left || 0;
    this.oldTop = imageRect.top || 0;
    this.oldOpacity = imageRect.opacity || 1;
    this.oldCornerRadius = imageRect.rx || 0;

    this.syncForm = options?.syncForm;
  }

  execute(): void {
    this.applySource(this.newSrc, this.newAttachments, true);
  }

  undo(): void {
    this.applySource(this.oldSrc, this.oldAttachments, false);
    this.syncForm?.();
  }

  override redo(): void {
    this.applySource(this.newSrc, this.newAttachments, true);
    this.syncForm?.();
  }

  private async applySource(src: string, attachments: any, isNewImage: boolean): Promise<void> {
    // Load image
    const imgElement = await FabricImage.fromURL(src, { crossOrigin: 'anonymous' });

    const newImageWidth = imgElement.width || 200;
    const newImageHeight = imgElement.height || 200;

    if (isNewImage) {
      // EXECUTE: Upload new image - maintain CURRENT display size and ALL current properties
      const currentDisplayWidth = this.oldWidth * this.oldScaleX;
      const currentDisplayHeight = this.oldHeight * this.oldScaleY;

      // Calculate new scale to maintain same display size
      const newScaleX = currentDisplayWidth / newImageWidth;
      const newScaleY = currentDisplayHeight / newImageHeight;

      // Store new dimensions for undo
      if (this.newWidth === 0) {
        this.newWidth = newImageWidth;
        this.newHeight = newImageHeight;
      }

      // Create new pattern
      const newPattern = new Pattern({
        source: imgElement.getElement(),
        repeat: 'no-repeat',
        crossOrigin: 'anonymous'
      });

      // Apply ALL properties - preserve everything from before
      this.imageRect.set({
        width: newImageWidth,
        height: newImageHeight,
        fill: newPattern,
        scaleX: newScaleX,
        scaleY: newScaleY,
        left: this.oldLeft,
        top: this.oldTop,
        opacity: this.oldOpacity,
        rx: this.oldCornerRadius,
        ry: this.oldCornerRadius,
        imageSrc: src,
        attachments: attachments
      });
    } else {
      // UNDO: Restore EXACT old state with old image
      const oldPattern = new Pattern({
        source: imgElement.getElement(),
        repeat: 'no-repeat',
        crossOrigin: 'anonymous'
      });

      // Restore EVERYTHING to old state
      this.imageRect.set({
        width: this.oldWidth,
        height: this.oldHeight,
        fill: oldPattern,
        scaleX: this.oldScaleX,
        scaleY: this.oldScaleY,
        left: this.oldLeft,
        top: this.oldTop,
        opacity: this.oldOpacity,
        rx: this.oldCornerRadius,
        ry: this.oldCornerRadius,
        imageSrc: src,
        attachments: attachments
      });
    }

    this.imageRect.setCoords();
    this.canvas.requestRenderAll();

    // Sync form after state change
    if (this.syncForm) {
      this.syncForm();
    }
  }
}
