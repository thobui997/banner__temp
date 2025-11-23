import { Canvas, FabricObject } from 'fabric';
import { Command } from '../types/command.type';

/**
 * Visibility Toggle Command
 *
 * Command để toggle visibility của object với undo/redo support.
 * Follows Command Pattern cho undo/redo system.
 *
 * SOLID Principles:
 * - Single Responsibility: Chỉ xử lý visibility toggle
 * - Command Pattern: Encapsulate action as object
 */
export class VisibilityToggleCommand extends Command {
  private wasVisible: boolean;

  constructor(
    private canvas: Canvas,
    private object: FabricObject
  ) {
    super();
    // Store current visibility state
    this.wasVisible = object.visible !== false;
  }

  execute(): void {
    // Toggle visibility
    const newVisibility = !this.wasVisible;
    this.object.set('visible', newVisibility);

    // Deselect if hiding
    if (!newVisibility) {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject === this.object) {
        this.canvas.discardActiveObject();
      }
    }

    this.canvas.requestRenderAll();
  }

  undo(): void {
    // Restore previous visibility
    this.object.set('visible', this.wasVisible);
    this.canvas.requestRenderAll();
  }

  redo(): void {
    // Toggle visibility again
    this.execute();
  }
}
