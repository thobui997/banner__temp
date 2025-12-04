import { Canvas, FabricObject } from 'fabric';
import { Command } from '../types/command.type';

export class TransformObjectCommand extends Command {
  private readonly oldProps: { 
    angle: number; 
    flipX: boolean; 
    flipY: boolean; 
    left: number; 
    top: number;
  };
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
      flipY: object.flipY ?? false,
      left: object.left ?? 0,
      top: object.top ?? 0
    };

    this.newProps = { ...newProperties };
  }

  execute(): void {
    this.apply(this.newProps);
    this.syncForm?.()
  }

  undo(): void {
    this.apply(this.oldProps);
    this.syncForm?.();
  }

  override redo(): void {
    this.apply(this.newProps);
    this.syncForm?.();
  }

  private apply(props: { 
    angle?: number; 
    flipX?: boolean; 
    flipY?: boolean; 
    left?: number; 
    top?: number 
  }) {
    // Store current center point before transformation
    const centerPoint = this.object.getCenterPoint();
    
    // Apply transformations
    this.object.set({
      ...(props.angle !== undefined && { angle: props.angle }),
      ...(props.flipX !== undefined && { flipX: props.flipX }),
      ...(props.flipY !== undefined && { flipY: props.flipY })
    });

    // If only rotating (no explicit position change), restore center position
    if (props.angle !== undefined && props.left === undefined && props.top === undefined) {
      this.object.setPositionByOrigin(centerPoint, 'center', 'center');
    } else if (props.left !== undefined && props.top !== undefined) {
      // Restore exact position for undo
      this.object.set({
        left: props.left,
        top: props.top
      });
    }

    this.object.setCoords();
    this.canvas.renderAll();
  }
}