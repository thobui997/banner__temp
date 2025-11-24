import { LayerManagementService } from '../services/layers/layer-management.service';
import { Command } from '../types/command.type';

export class ToggleLayerVisibilityCommand extends Command {
  private previousVisibility: boolean;

  constructor(
    private layerManagementService: LayerManagementService,
    private layerId: string
  ) {
    super();
    const layer = this.layerManagementService.getLayers().find((l) => l.id === layerId);
    this.previousVisibility = layer?.visible ?? true;
  }

  execute(): void {
    this.layerManagementService.toggleVisibility(this.layerId);
  }

  undo(): void {
    this.layerManagementService.toggleVisibility(this.layerId);
  }
}
