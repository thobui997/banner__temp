import { Canvas, IText, Textbox } from 'fabric';
import { Command } from '../../types';

export class UpdateTextSelectionStylesCommand extends Command {
  private oldStylesSnapshot: any = null;
  private newStylesSnapshot: any = null;
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

    // Save complete snapshot of styles before change
    this.oldStylesSnapshot = this.cloneStyles(this.textObj.styles);

    // Apply new styles and save that snapshot too
    this.applyStylesToSelection(this.newStyles);
    this.newStylesSnapshot = this.cloneStyles(this.textObj.styles);
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
    // Already executed in constructor, but needed for redo
    this.restoreStylesSnapshot(this.newStylesSnapshot);
  }

  undo(): void {
    this.restoreStylesSnapshot(this.oldStylesSnapshot);
    this.syncForm?.();
  }

  override redo(): void {
    this.restoreStylesSnapshot(this.newStylesSnapshot);
    this.syncForm?.();
  }

  private applyStylesToSelection(styles: Record<string, any>): void {
    this.textObj.setSelectionStyles(styles, this.selectionStart, this.selectionEnd);
    this.textObj.initDimensions();
    this.textObj.setCoords();
    this.canvas.requestRenderAll();
  }

  private restoreStylesSnapshot(stylesSnapshot: any): void {
    // Restore the entire styles object
    this.textObj.styles = this.cloneStyles(stylesSnapshot);

    this.textObj.initDimensions();
    this.textObj.setCoords();
    this.canvas.requestRenderAll();
  }
}
