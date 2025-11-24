import { Canvas, FabricObject } from 'fabric';
import { Command } from '../types/command.type';

export class TransformObjectCommand extends Command {
  private readonly oldProps: { angle: number; flipX: boolean; flipY: boolean };
  private readonly newProps: { angle?: number; flipX?: boolean; flipY?: boolean };

  constructor(
    private canvas: Canvas,
    private object: FabricObject,
    newProperties: { angle?: number; flipX?: boolean; flipY?: boolean },
    private syncForm?: () => void
  ) {
    super();

    this.oldProps = {
      angle: object.angle ?? 0,
      flipX: object.flipX ?? false,
      flipY: object.flipY ?? false
    };

    this.newProps = { ...newProperties };
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

  private apply(props: { angle?: number; flipX?: boolean; flipY?: boolean }) {
    this.object.set({
      ...(props.angle !== undefined && { angle: props.angle }),
      ...(props.flipX !== undefined && { flipX: props.flipX }),
      ...(props.flipY !== undefined && { flipY: props.flipY })
    });

    this.object.setCoords();
    this.canvas.renderAll();
  }
}
