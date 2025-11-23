import { Canvas, FabricObject } from 'fabric/*';
import { Command } from '../types/command.type';

export class MoveObjectCommand extends Command {
  private oldLeft: number;
  private oldTop: number;

  constructor(
    private canvas: Canvas,
    private object: FabricObject,
    private newLeft: number,
    private newTop: number
  ) {
    super();
    this.oldLeft = object.left || 0;
    this.oldTop = object.top || 0;
  }

  execute(): void {
    this.object.set({ left: this.newLeft, top: this.newTop });
    this.object.setCoords();
    this.canvas.requestRenderAll();
  }

  undo(): void {
    this.object.set({ left: this.oldLeft, top: this.oldTop });
    this.object.setCoords();
    this.canvas.requestRenderAll();
  }
}
