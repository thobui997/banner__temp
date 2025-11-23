import { Component } from '@angular/core';
import { PageLayoutComponent } from '@gsf/admin/app/shared/layouts';
import { TemplateEditorContainerComponent } from '../../components/layouts/template-editor-container.component';
import { CanvasEventHandlerService } from '../../services/canvas/canvas-event-handler.service';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { CanvasInitializationService } from '../../services/canvas/canvas-initialization.service';
import { CanvasStateService } from '../../services/canvas/canvas-state.service';
import { ObjectConstraintService } from '../../services/objects/object-constraint.service';
import { ObjectCreationService } from '../../services/objects/object-creation.service';
import { ObjectPropertiesExtractorService } from '../../services/objects/object-properties-extractor.service';
import { ObjectUpdateService } from '../../services/objects/object-update.service';
import { LayerManagementService } from '../../services/layers/layer-management.service';

@Component({
  selector: 'app-template-add',
  standalone: true,
  templateUrl: './template-add.component.html',
  imports: [PageLayoutComponent, TemplateEditorContainerComponent],
  providers: [
    CanvasFacadeService,
    CanvasStateService,
    CanvasInitializationService,
    ObjectCreationService,
    ObjectUpdateService,
    CanvasEventHandlerService,
    ObjectPropertiesExtractorService,
    ObjectConstraintService,
    LayerManagementService
  ]
})
export class TemplateAddComponent {}
