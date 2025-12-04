import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageTitleComponent } from '@gsf/admin/app/shared/components';
import { PageLayoutComponent } from '@gsf/admin/app/shared/layouts';
import { ErrorMappingService } from '@gsf/admin/app/shared/services/error-mapping.service';
import {
  ButtonDirective,
  ICON_ARROW_LEFT_OUTLINE,
  ICON_EDIT_2_OUTLINE,
  IconSvgComponent
} from '@gsf/ui';
import { TemplateApiService } from '../../services/api/template-api.service';
import { CanvasEventHandlerService } from '../../services/canvas/canvas-event-handler.service';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { CanvasInitializationService } from '../../services/canvas/canvas-initialization.service';
import { CanvasStateService } from '../../services/canvas/canvas-state.service';
import { CanvasZoomService } from '../../services/canvas/canvas-zoom.service';
import { GeneralInfomationFormService } from '../../services/forms/general-information-form.service';
import { FrameManagementService } from '../../services/frame/frame-management.service';
import { FrameRatioService } from '../../services/frame/frame-ratio.service';
import { LayerManagementService } from '../../services/layers/layer-management.service';
import { ObjectCreationService } from '../../services/objects/object-creation.service';
import { ObjectDeserializerService } from '../../services/objects/object-deserializer.service';
import { ObjectPropertiesExtractorService } from '../../services/objects/object-properties-extractor.service';
import { ObjectUpdateService } from '../../services/objects/object-update.service';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';
import { SnapLineService } from '../../services/canvas/canvas-snap-line.service';
import { Destroyer } from '@gsf/admin/app/shared/base';
import { TemplateViewEditorContainerComponent } from '../../components/view/template-view-editor-container.component';
import { CommandManagerService } from '../../services/command/command-manager.service';

@Component({
  selector: 'app-template-view',
  standalone: true,
  templateUrl: './template-view.component.html',
  imports: [
    PageLayoutComponent,
    TemplateViewEditorContainerComponent,
    PageTitleComponent,
    ButtonDirective,
    IconSvgComponent
  ],
  providers: [
    CanvasFacadeService,
    CanvasStateService,
    CanvasInitializationService,
    ObjectCreationService,
    ObjectUpdateService,
    CanvasEventHandlerService,
    ObjectPropertiesExtractorService,
    LayerManagementService,
    GeneralInfomationFormService,
    TemplateApiService,
    FrameManagementService,
    ObjectDeserializerService,
    FrameRatioService,
    SnapLineService,
    CanvasZoomService,
    PanelToggleService,
    CommandManagerService
  ]
})
export class TemplateViewComponent extends Destroyer implements OnInit {
  private route = inject(ActivatedRoute);
  private generalInfoFormService = inject(GeneralInfomationFormService);
  private templateApiService = inject(TemplateApiService);
  private canvasFacadeService = inject(CanvasFacadeService);
  private errorMappingService = inject(ErrorMappingService);
  private frameRatioService = inject(FrameRatioService);
  private router = inject(Router);

  ICON_LEFT_OUTLINE = ICON_ARROW_LEFT_OUTLINE;
  ICON_EDIT_2_OUTLINE = ICON_EDIT_2_OUTLINE;
  templateId: number | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.templateId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.templateId) {
      this.loadTemplate();
    }
  }

  goToList() {
    this.router.navigateByUrl('/template');
  }

  goToEdit() {
    this.router.navigate(['/template/edit', this.templateId]);
  }

  private loadTemplate(): void {
    if (!this.templateId) return;

    this.isLoading = true;

    this.templateApiService.getTemplateById(this.templateId).subscribe({
      next: (response) => {
        const template = response.result;

        // Load general information into form (disabled mode)
        this.generalInfoFormService.patchForm({
          name: template.name,
          description: template.description
        });

        // Disable form
        const form = this.generalInfoFormService.getForm();
        form.disable();

        this.frameRatioService.changeRatio(template.ratio);

        // Load JSON into canvas (delay to ensure canvas is initialized)
        setTimeout(async () => {
          const jsonContent = template.templateContent.jsonFile;
          await this.canvasFacadeService.loadTemplateFromJson(jsonContent);
          this.makeCanvasReadOnly();
          this.isLoading = false;
        }, 0);
      },
      error: (err) => {
        this.errorMappingService.toToast(err);
        this.isLoading = false;
      }
    });
  }

  private makeCanvasReadOnly(): void {
    const canvas = this.canvasFacadeService.getCanvas();
    if (!canvas) return;

    // Disable selection
    canvas.selection = false;
    canvas.skipTargetFind = true;

    // Make all objects non-selectable and non-interactive
    canvas.forEachObject((obj) => {
      obj.selectable = false;
      obj.evented = false;
      obj.hasControls = false;
      obj.hasBorders = false;
      obj.lockMovementX = true;
      obj.lockMovementY = true;
      obj.lockRotation = true;
      obj.lockScalingX = true;
      obj.lockScalingY = true;
    });

    // Set cursor to default
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'default';

    canvas.requestRenderAll();
  }
}
