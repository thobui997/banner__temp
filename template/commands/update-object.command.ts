import { Canvas, FabricObject } from 'fabric/*';
import { Command } from '../types/command.type';

export class UpdatePropertiesCommand extends Command {
  private oldProperties: Record<string, any> = {};

  constructor(
    private canvas: Canvas,
    private object: FabricObject,
    private newProperties: Record<string, any>
  ) {
    super();
    // Store old properties
    Object.keys(newProperties).forEach((key) => {
      this.oldProperties[key] = (object as any)[key];
    });
  }

  execute(): void {
    this.object.set(this.newProperties);
    this.object.setCoords();
    this.canvas.requestRenderAll();
  }

  undo(): void {
    this.object.set(this.oldProperties);
    this.object.setCoords();
    this.canvas.requestRenderAll();
  }
}
