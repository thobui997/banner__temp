import { Canvas, FabricObject } from 'fabric';
import { Command } from '../types/command.type';

/**
 * Reorder Layers Command
 *
 * Command để reorder layers (z-index) với undo/redo support.
 * Follows Command Pattern cho undo/redo system.
 *
 * SOLID Principles:
 * - Single Responsibility: Chỉ xử lý layer reordering
 * - Command Pattern: Encapsulate action as object
 */
export class ReorderLayersCommand extends Command {
  private previousOrder: FabricObject[];

  constructor(
    private canvas: Canvas,
    private previousIndex: number,
    private currentIndex: number
  ) {
    super();
    // Store previous order of all objects
    this.previousOrder = [...canvas.getObjects()];
  }

  execute(): void {
    const objects = this.canvas.getObjects();

    // Move object from previousIndex to currentIndex
    const [movedObject] = objects.splice(this.previousIndex, 1);
    objects.splice(this.currentIndex, 0, movedObject);

    // Clear canvas
    this.canvas.remove(...this.canvas.getObjects());

    // Re-add objects in new order
    objects.forEach((obj) => {
      this.canvas.add(obj);
    });

    this.canvas.requestRenderAll();
  }

  undo(): void {
    // Restore previous order
    this.canvas.remove(...this.canvas.getObjects());

    this.previousOrder.forEach((obj) => {
      this.canvas.add(obj);
    });

    this.canvas.requestRenderAll();
  }

  redo(): void {
    // Re-apply the reordering
    this.execute();
  }
}
