import { Canvas, FabricObject } from 'fabric';
import { Command } from '../types/command.type';

export class ScaleObjectCommand extends Command {
  private oldProps: { scaleX: number; scaleY: number };
  private newProps: { scaleX: number; scaleY: number };

  constructor(
    private canvas: Canvas,
    private object: FabricObject,
    oldScaleX: number,
    oldScaleY: number,
    newScaleX: number,
    newScaleY: number,
    private syncForm?: () => void
  ) {
    super();

    this.oldProps = { scaleX: oldScaleX, scaleY: oldScaleY };
    this.newProps = { scaleX: newScaleX, scaleY: newScaleY };
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

  private apply(props: { scaleX: number; scaleY: number }) {
    this.object.set(props);
    this.object.setCoords();
    this.canvas.renderAll();
  }
}
