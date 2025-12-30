import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Destroyer } from '@gsf/admin/app/shared/base';
import { PageTitleComponent } from '@gsf/admin/app/shared/components';
import { IsGrantedByPermissionsDirective } from '@gsf/admin/app/shared/directives';
import { PermissionEnum } from '@gsf/admin/app/shared/enums/permission.enum';
import { PageLayoutComponent } from '@gsf/admin/app/shared/layouts';
import {
  CanvasEventHandlerService,
  CanvasFacadeService,
  CanvasInitializationService,
  CanvasStateService,
  CanvasZoomService,
  CommandManagerService,
  FrameManagementService,
  FrameRatioService,
  GeneralInfomationFormService,
  LayerManagementService,
  ObjectCreationService,
  ObjectDeserializerService,
  ObjectPropertiesExtractorService,
  PanelToggleService,
  SnapLineService
} from '@gsf/admin/app/shared/services';
import { ErrorMappingService } from '@gsf/admin/app/shared/services/error-mapping.service';
import {
  ButtonDirective,
  ICON_ARROW_LEFT_OUTLINE,
  ICON_EDIT_2_OUTLINE,
  IconSvgComponent
} from '@gsf/ui';
import { TemplateViewEditorContainerComponent } from '../../components/view/template-view-editor-container.component';
import { TemplateApiService } from '../../services/api/template-api.service';

@Component({
  selector: 'app-template-view',
  standalone: true,
  templateUrl: './template-view.component.html',
  imports: [
    PageLayoutComponent,
    TemplateViewEditorContainerComponent,
    PageTitleComponent,
    ButtonDirective,
    IconSvgComponent,
    IsGrantedByPermissionsDirective
  ],
  providers: [
    CanvasFacadeService,
    CanvasStateService,
    CanvasInitializationService,
    ObjectCreationService,
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
  PermissionEnum = PermissionEnum;

  ngOnInit(): void {
    this.templateId = Number(this.route.snapshot.paramMap.get('id'));
  }

  goToList() {
    this.router.navigateByUrl('/template');
  }

  goToEdit() {
    this.router.navigate(['/template/edit', this.templateId]);
  }

  loadTemplateData(): void {
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

          this.canvasFacadeService.resetViewport();
          this.canvasFacadeService.zoomToFit();

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

    // Make all objects non-selectable and non-interactive
    canvas.forEachObject((obj: any) => {
      obj.selectable = true;
      obj.evented = true;
      obj.hasControls = true;
      obj.hasBorders = true;
      obj.lockMovementX = true;
      obj.lockMovementY = true;
      obj.lockRotation = true;
      obj.lockScalingX = true;
      obj.lockScalingY = true;
      obj.lockScalingFlip = true;
      obj.lockSkewingX = true;
      obj.lockSkewingY = true;
      obj.editable = false;
    });

    // Set cursor to default
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'default';

    canvas.requestRenderAll();
  }
}
