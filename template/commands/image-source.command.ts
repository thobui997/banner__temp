import { Canvas, FabricImage, Rect } from 'fabric';
import { Command } from '../types/command.type';

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
  private syncForm?: () => void;

  constructor(
    private canvas: Canvas,
    private imageObj: FabricImage,
    private newSrc: string,
    private newAttachments: any,
    options?: {
      syncForm?: () => void;
    }
  ) {
    super();

    // Store old values
    this.oldSrc = imageObj.getSrc();
    this.oldAttachments = imageObj.get('attachments');
    this.oldWidth = imageObj.width || 0;
    this.oldHeight = imageObj.height || 0;
    this.oldScaleX = imageObj.scaleX || 1;
    this.oldScaleY = imageObj.scaleY || 1;
    this.oldLeft = imageObj.left || 0;
    this.oldTop = imageObj.top || 0;
    this.oldOpacity = imageObj.opacity || 1;

    // Store corner radius from clipPath
    const clipPath = imageObj.clipPath;
    if (clipPath && clipPath instanceof Rect) {
      this.oldCornerRadius = clipPath.rx || 0;
    } else {
      this.oldCornerRadius = 0;
    }

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

  private applySource(src: string, attachments: any, isNewImage: boolean): void {
    this.imageObj.set('attachments', attachments);

    this.imageObj.setSrc(src, { crossOrigin: 'anonymous' }).then(() => {
      if (isNewImage) {
        // When uploading NEW image: maintain current position and scale
        // Calculate scale to maintain current display size
        const currentDisplayWidth = this.oldWidth * this.oldScaleX;
        const currentDisplayHeight = this.oldHeight * this.oldScaleY;

        const newWidth = this.imageObj.width || 1;
        const newHeight = this.imageObj.height || 1;

        // Calculate new scale to maintain the same display size
        const newScaleX = currentDisplayWidth / newWidth;
        const newScaleY = currentDisplayHeight / newHeight;

        this.imageObj.set({
          scaleX: newScaleX,
          scaleY: newScaleY,
          left: this.oldLeft,
          top: this.oldTop,
          opacity: this.oldOpacity
        });

        // Restore corner radius
        if (this.oldCornerRadius > 0) {
          const clipPath = new Rect({
            width: newWidth,
            height: newHeight,
            rx: this.oldCornerRadius,
            ry: this.oldCornerRadius,
            originX: 'center',
            originY: 'center'
          });
          this.imageObj.set('clipPath', clipPath);
        }
      } else {
        // When undoing: restore exact old state
        this.imageObj.set({
          scaleX: this.oldScaleX,
          scaleY: this.oldScaleY,
          left: this.oldLeft,
          top: this.oldTop,
          opacity: this.oldOpacity
        });

        // Restore old corner radius
        if (this.oldCornerRadius > 0) {
          const clipPath = new Rect({
            width: this.oldWidth,
            height: this.oldHeight,
            rx: this.oldCornerRadius,
            ry: this.oldCornerRadius,
            originX: 'center',
            originY: 'center'
          });
          this.imageObj.set('clipPath', clipPath);
        }
      }

      this.imageObj.setCoords();
      this.canvas.requestRenderAll();
    });
  }
}
