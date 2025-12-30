import { Canvas, FabricObject } from 'fabric';
import { Command } from '../../types';

export class AlignObjectCommand extends Command {
  private readonly oldProps: { left: number; top: number };
  private readonly newProps: { left: number; top: number };

  constructor(
    private canvas: Canvas,
    private object: FabricObject,
    newLeft: number,
    newTop: number,
    private syncForm?: () => void
  ) {
    super();

    this.oldProps = {
      left: this.object.left ?? 0,
      top: this.object.top ?? 0
    };

    this.newProps = {
      left: newLeft,
      top: newTop
    };
  }

  execute(): void {
    this.apply(this.newProps);
  }

  undo(): void {
    this.apply(this.oldProps);
    this.syncForm?.();
  }

  override redo(): void {
    this.apply(this.newProps);
    this.syncForm?.();
  }

  private apply(props: { left: number; top: number }) {
    this.object.set({
      left: props.left,
      top: props.top
    });

    this.object.setCoords();
    this.canvas.renderAll();
  }
}
