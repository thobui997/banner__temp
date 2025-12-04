import { LayerManagementService } from '../services/layers/layer-management.service';
import { Command } from '../types/command.type';

export class RenameLayerCommand extends Command {
  constructor(
    private layerManagementService: LayerManagementService,
    private layerId: string,
    private oldName: string,
    private newName: string
  ) {
    super();
  }

  execute(): void {
    this.layerManagementService.renameLayer(this.layerId, this.newName);
  }

  undo(): void {
    this.layerManagementService.renameLayer(this.layerId, this.oldName);
  }
}