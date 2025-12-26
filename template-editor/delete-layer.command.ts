import { Canvas, FabricObject } from 'fabric';
import { Command } from '../../types';
import { LayerManagementService } from '../../services';

export class DeleteLayerCommand extends Command {
  private deletedObject: FabricObject | null = null;
  private deletedObjectIndex = -1;

  constructor(
    private layerManagementService: LayerManagementService,
    private canvas: Canvas,
    private layerId: string
  ) {
    super();
    this.canvas = canvas;
  }

  execute(): void {
    if (!this.canvas) return;

    const layer = this.layerManagementService.getLayers().find((l) => l.id === this.layerId);
    if (!layer || !layer.fabricObject) return;

    this.deletedObject = layer.fabricObject;
    const objects = this.canvas.getObjects();
    this.deletedObjectIndex = objects.indexOf(this.deletedObject);

    this.layerManagementService.deleteLayer(this.layerId);
  }

  undo(): void {
    if (!this.canvas || !this.deletedObject) return;
    this.canvas.insertAt(this.deletedObjectIndex, this.deletedObject);

    this.layerManagementService.syncLayers();
    this.canvas.requestRenderAll();
  }
}
