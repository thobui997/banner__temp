import { Canvas, FabricObject } from 'fabric';
import { Command } from '../../types';
import * as FontFaceObserver from 'fontfaceobserver';

export class UpdateFontCommand extends Command {
  private oldFontFamily: string;
  private oldFontWeight: number | string;
  private oldFontSize?: number;
  private syncForm?: () => void;

  constructor(
    private canvas: Canvas,
    private object: FabricObject,
    private newFontFamily: string,
    private newFontWeight?: number | string,
    private newFontSize?: number,
    syncForm?: () => void
  ) {
    super();

    this.oldFontFamily = this.object.get('fontFamily') as string;
    this.oldFontWeight = this.object.get('fontWeight') as number | string;

    if (newFontSize !== undefined) {
      this.oldFontSize = this.object.get('fontSize') as number;
    }

    this.syncForm = syncForm;
  }

  async execute(): Promise<void> {
    await this.applyFont(
      this.newFontFamily,
      this.newFontWeight ?? this.oldFontWeight,
      this.newFontSize
    );
  }

  async undo(): Promise<void> {
    await this.applyFont(this.oldFontFamily, this.oldFontWeight, this.oldFontSize);

    if (this.syncForm) {
      requestAnimationFrame(() => {
        this.syncForm?.();
      });
    }
  }

  override async redo(): Promise<void> {
    await this.applyFont(
      this.newFontFamily,
      this.newFontWeight ?? this.oldFontWeight,
      this.newFontSize
    );

    if (this.syncForm) {
      requestAnimationFrame(() => {
        this.syncForm?.();
      });
    }
  }

  private async applyFont(
    fontFamily: string,
    fontWeight: number | string,
    fontSize?: number
  ): Promise<void> {
    try {
      const font = new FontFaceObserver(fontFamily);

      await font.load(null, 60000);
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const updates: any = {
        fontFamily,
        fontWeight,
        dirty: true
      };

      if (fontSize !== undefined) {
        updates.fontSize = fontSize;
      }

      this.object.set(updates);
      this.object.setCoords();
      this.canvas.renderAll();

      if ('initDimensions' in this.object && typeof this.object.initDimensions === 'function') {
        this.object.initDimensions();
        this.object.setCoords();
        this.canvas.renderAll();
      }
    } catch (error) {
      const updates: any = {
        fontFamily,
        fontWeight,
        dirty: true
      };

      if (fontSize !== undefined) {
        updates.fontSize = fontSize;
      }

      this.object.set(updates);
      this.object.setCoords();
      this.canvas.renderAll();
    }
  }
}
