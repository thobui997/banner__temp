import { LayerManagementService } from '../services/layers/layer-management.service';
import { Command } from '../types/command.type';

export class ReorderLayerCommand extends Command {
  constructor(
    private layerService: LayerManagementService,
    private previousIndex: number,
    private currentIndex: number
  ) {
    super();
  }

  execute(): void {
    this.layerService.reorderLayers(this.previousIndex, this.currentIndex);
  }

  undo(): void {
    this.layerService.reorderLayers(this.currentIndex, this.previousIndex);
  }

  override redo(): void {
    this.execute();
  }
}
