import { Canvas, FabricObject } from 'fabric';
import { Command } from '../types/command.type';

export class RotateObjectCommand extends Command {
  private oldProps: { angle: number };
  private newProps: { angle: number };

  constructor(
    private canvas: Canvas,
    private object: FabricObject,
    oldAngle: number,
    newAngle: number,
    private syncForm?: () => void
  ) {
    super();

    this.oldProps = { angle: oldAngle };
    this.newProps = { angle: newAngle };
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

  private apply(props: { angle: number }) {
    this.object.set(props);
    this.object.setCoords();
    this.canvas.renderAll();
  }
}
