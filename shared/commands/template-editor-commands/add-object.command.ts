import { Canvas, FabricObject } from 'fabric/*';
import { Command } from '../../types';

export class AddObjectCommand extends Command {
  constructor(
    private canvas: Canvas,
    private object: FabricObject
  ) {
    super();
  }

  execute(): void {
    this.canvas.add(this.object);
    this.canvas.bringObjectToFront(this.object);
    this.canvas.setActiveObject(this.object);
    this.canvas.requestRenderAll();
  }

  undo(): void {
    this.canvas.remove(this.object);
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }
}
