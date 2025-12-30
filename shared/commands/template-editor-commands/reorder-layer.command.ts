import { LayerManagementService } from '../../services';
import { Command } from '../../types';

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
