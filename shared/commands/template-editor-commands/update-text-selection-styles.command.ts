import { Canvas, IText, Textbox } from 'fabric';
import { Command } from '../../types';
import * as FontFaceObserver from 'fontfaceobserver';

export class UpdateTextSelectionStylesCommand extends Command {
  private oldStylesSnapshot: any = null;
  private selectionStart: number;
  private selectionEnd: number;
  private syncForm?: () => void;

  constructor(
    private canvas: Canvas,
    private textObj: IText | Textbox,
    private newStyles: Record<string, any>,
    private range: { start: number; end: number },
    syncForm?: () => void
  ) {
    super();
    this.selectionStart = range.start;
    this.selectionEnd = range.end;
    this.syncForm = syncForm;

    this.oldStylesSnapshot = this.cloneStyles(this.textObj.styles);
  }

  /**
   * Deep clone styles object to avoid reference issues
   */
  private cloneStyles(styles: any): any {
    if (!styles) return {};

    const cloned: any = {};

    for (const lineIndex in styles) {
      cloned[lineIndex] = {};

      for (const charIndex in styles[lineIndex]) {
        cloned[lineIndex][charIndex] = { ...styles[lineIndex][charIndex] };
      }
    }

    return cloned;
  }

  execute(): void {
    this.applyStylesToSelection(this.newStyles);
  }

  undo(): void {
    this.restoreStylesSnapshot(this.oldStylesSnapshot);
    this.syncForm?.();
  }

  override redo(): void {
    this.applyStylesToSelection(this.newStyles);
    this.syncForm?.();
  }

  private applyStylesToSelection(styles: Record<string, any>): void {
    this.textObj.objectCaching = false;

    if (!styles['fontFamily']) {
      // Apply styles directly if no font change
      this.textObj.setSelectionStyles(styles, this.selectionStart, this.selectionEnd);
      this.textObj.initDimensions();
      this.textObj.setCoords();
      this.textObj.dirty = true;
      requestAnimationFrame(() => {
        this.textObj.objectCaching = true;
        this.canvas.requestRenderAll();
      });
      return;
    }

    const font = new FontFaceObserver(styles['fontFamily']);

    font.load(null, 60000).then(() => {
      // Apply styles
      this.textObj.setSelectionStyles(styles, this.selectionStart, this.selectionEnd);
      // Re-calculate dimensions
      this.textObj.initDimensions();
      this.textObj.setCoords();
      this.textObj.dirty = true;

      requestAnimationFrame(() => {
        this.textObj.objectCaching = true;
        this.canvas.requestRenderAll();
      });
    });
  }

  private restoreStylesSnapshot(stylesSnapshot: any): void {
    // Clear object cache
    this.textObj.objectCaching = false;

    // Restore the entire styles object
    this.textObj.styles = this.cloneStyles(stylesSnapshot);

    // Re-calculate dimensions
    this.textObj.initDimensions();
    this.textObj.setCoords();
    this.textObj.dirty = true;

    // Re-enable caching và render
    requestAnimationFrame(() => {
      this.textObj.objectCaching = true;
      this.canvas.requestRenderAll();
    });
  }
}
