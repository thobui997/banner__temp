import { LayerManagementService } from '../../services';
import { Command } from '../../types';

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
