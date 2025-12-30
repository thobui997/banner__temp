import { Canvas, FabricObject } from 'fabric';
import { Command } from '../../types';

export class MoveObjectCommand extends Command {
  private oldProps: { left: number; top: number };
  private newProps: { left: number; top: number };

  constructor(
    private canvas: Canvas,
    private object: FabricObject,
    oldLeft: number,
    oldTop: number,
    newLeft: number,
    newTop: number,
    private syncForm?: () => void
  ) {
    super();

    this.oldProps = { left: oldLeft, top: oldTop };
    this.newProps = { left: newLeft, top: newTop };
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
    this.object.set(props);
    this.object.setCoords();
    this.canvas.renderAll();
  }
}
