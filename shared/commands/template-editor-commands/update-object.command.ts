import { Canvas, FabricObject } from 'fabric';
import { Command } from '../../types';

export class UpdatePropertiesCommand extends Command {
  private oldProperties: Record<string, any> = {};
  private validNewProps: Record<string, any> = {};
  private syncForm?: () => void;

  constructor(
    private canvas: Canvas,
    private object: FabricObject,
    newProperties: Record<string, any>,
    syncForm?: () => void
  ) {
    super();

    Object.entries(newProperties).forEach(([key, value]) => {
      if (value !== undefined) {
        this.validNewProps[key] = value;
        this.oldProperties[key] = this.object.get(key);
      }
    });

    this.syncForm = syncForm;
  }

  execute(): void {
    this.applyProperties(true);
  }

  undo(): void {
    this.applyProperties(false);
    this.syncForm?.();
  }

  override redo(): void {
    this.applyProperties(true);
    this.syncForm?.();
  }

  private applyProperties(useNewProperties: boolean) {
    const properties = useNewProperties ? this.validNewProps : this.oldProperties;

    Object.entries(properties).forEach(([key, value]) => {
      this.object.set(key as any, value);
    });

    this.object.set('dirty', true);
    this.object.setCoords();
    this.canvas.renderAll();
  }
}
