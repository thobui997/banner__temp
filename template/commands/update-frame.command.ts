import { Canvas, FabricObject } from 'fabric';
import { Command } from '../types/command.type';

export class UpdateFrameCommand extends Command {
  private oldState: any;
  private newState: any;
  private onUpdate?: () => void;

  constructor(
    private canvas: Canvas,
    private frame: FabricObject,
    oldState: any,
    newState: any,
    onUpdate?: () => void
  ) {
    super();
    this.oldState = { ...oldState };
    this.newState = { ...newState };
    this.onUpdate = onUpdate;
  }

  execute(): void {
    this.applyState(this.newState);
  }

  undo(): void {
    this.applyState(this.oldState);
    this.onUpdate?.();
  }

  override redo(): void {
    this.applyState(this.newState);
    this.onUpdate?.();
  }

  private applyState(state: any): void {
    this.frame.set({
      left: state.left,
      top: state.top,
      scaleX: state.scaleX,
      scaleY: state.scaleY
    });

    if (state.width) {
      this.frame.set('width', state.width);
    }
    if (state.height) {
      this.frame.set('height', state.height);
    }

    this.frame.setCoords();
    this.onUpdate?.();
    this.canvas.renderAll();
  }
}
