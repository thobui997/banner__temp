import { Canvas, FabricImage } from 'fabric';
import { Command } from '../types/command.type';

export class UpdateImageSourceCommand extends Command {
  private oldSrc: string;
  private oldAttachments: any;
  private oldWidth: number;
  private oldHeight: number;
  private oldScaleX: number;
  private oldScaleY: number;
  private syncForm?: () => void;
  private fitImageToFrame?: (image: FabricImage) => void;

  constructor(
    private canvas: Canvas,
    private imageObj: FabricImage,
    private newSrc: string,
    private newAttachments: any,
    options?: {
      syncForm?: () => void;
      fitImageToFrame?: (image: FabricImage) => void;
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

    this.syncForm = options?.syncForm;
    this.fitImageToFrame = options?.fitImageToFrame;
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

  private applySource(src: string, attachments: any, shouldFit: boolean): void {
    this.imageObj.set('attachments', attachments);

    this.imageObj.setSrc(src, { crossOrigin: 'anonymous' }).then(() => {
      if (shouldFit && this.fitImageToFrame) {
        this.fitImageToFrame(this.imageObj);
      } else if (!shouldFit) {
        // Restore old dimensions when undoing
        this.imageObj.set({
          scaleX: this.oldScaleX,
          scaleY: this.oldScaleY
        });
      }

      this.imageObj.setCoords();
      this.canvas.requestRenderAll();
    });
  }
}
