import { Canvas, FabricObject } from 'fabric';
import { Command } from '../../types';

interface ObjectUpdate {
  object: FabricObject;
  properties: Record<string, any>;
}

export class UpdateMultiObjectPropsCommand extends Command {
  private updates: Array<{
    object: FabricObject;
    oldProperties: Record<string, any>;
    newProperties: Record<string, any>;
  }> = [];

  private syncForm?: () => void;
  private afterUpdate?: () => void;

  constructor(
    private canvas: Canvas,
    objectUpdates: ObjectUpdate[],
    options?: {
      syncForm?: () => void;
      afterUpdate?: () => void;
    }
  ) {
    super();

    this.syncForm = options?.syncForm;
    this.afterUpdate = options?.afterUpdate;

    // Store old and new properties for each object
    objectUpdates.forEach(({ object, properties }) => {
      const oldProperties: Record<string, any> = {};
      const newProperties: Record<string, any> = {};

      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined) {
          oldProperties[key] = object.get(key);
          newProperties[key] = value;
        }
      });

      if (Object.keys(newProperties).length > 0) {
        this.updates.push({
          object,
          oldProperties,
          newProperties
        });
      }
    });
  }

  execute(): void {
    this.applyUpdates(true);
  }

  undo(): void {
    this.applyUpdates(false);
    this.syncForm?.();
  }

  override redo(): void {
    this.applyUpdates(true);
    this.syncForm?.();
  }

  private applyUpdates(useNewProperties: boolean): void {
    this.updates.forEach(({ object, oldProperties, newProperties }) => {
      const properties = useNewProperties ? newProperties : oldProperties;

      Object.entries(properties).forEach(([key, value]) => {
        object.set(key as any, value);
      });

      object.setCoords();
    });

    this.afterUpdate?.();
    this.canvas.renderAll();
  }
}
