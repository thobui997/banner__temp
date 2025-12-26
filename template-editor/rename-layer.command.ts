import { LayerManagementService } from '../../services';
import { Command } from '../../types';

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
