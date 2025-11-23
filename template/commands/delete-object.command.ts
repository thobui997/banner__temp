import { Canvas, FabricObject } from 'fabric/*';
import { Command } from '../types/command.type';

export class DeleteObjectCommand extends Command {
  private objectIndex = -1;

  constructor(
    private canvas: Canvas,
    private object: FabricObject
  ) {
    super();
  }

  execute(): void {
    const objects = this.canvas.getObjects();
    this.objectIndex = objects.indexOf(this.object);
    this.canvas.remove(this.object);
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  undo(): void {
    this.canvas.insertAt(this.objectIndex, this.object);
    this.canvas.setActiveObject(this.object);
    this.canvas.requestRenderAll();
  }
}
