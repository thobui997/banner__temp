import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UnsavedDataTracker } from '@gsf/admin/app/shared/base';
import { PageTitleComponent } from '@gsf/admin/app/shared/components';
import { FileModule } from '@gsf/admin/app/shared/enums';
import { PageLayoutComponent } from '@gsf/admin/app/shared/layouts';
import { WithCanDeactivate } from '@gsf/admin/app/shared/mixins';
import { FileUploadService } from '@gsf/admin/app/shared/services/api/file-upload.service';
import { ErrorMappingService } from '@gsf/admin/app/shared/services/error-mapping.service';
import { ButtonDirective, ICON_ARROW_LEFT_OUTLINE, IconSvgComponent, ToastService } from '@gsf/ui';
import { map, switchMap } from 'rxjs';
import { TemplateEditorContainerComponent } from '../../components/layouts/template-editor-container.component';
import { TemplateApiService } from '../../services/api/template-api.service';
import { CanvasEventHandlerService } from '../../services/canvas/canvas-event-handler.service';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { CanvasInitializationService } from '../../services/canvas/canvas-initialization.service';
import { CanvasStateService } from '../../services/canvas/canvas-state.service';
import { GeneralInfomationFormService } from '../../services/forms/general-information-form.service';
import { FrameManagementService } from '../../services/frame/frame-management.service';
import { FrameRatioService } from '../../services/frame/frame-ratio.service';
import { LayerManagementService } from '../../services/layers/layer-management.service';
import { ObjectCreationService } from '../../services/objects/object-creation.service';
import { ObjectDeserializerService } from '../../services/objects/object-deserializer.service';
import { ObjectPropertiesExtractorService } from '../../services/objects/object-properties-extractor.service';
import { ObjectUpdateService } from '../../services/objects/object-update.service';
import { TemplateUpdateRequest } from '../../types/template.type';
import { SnapLineService } from '../../services/canvas/canvas-snap-line.service';
import { CanvasZoomService } from '../../services/canvas/canvas-zoom.service';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';
import { Location } from '@angular/common';
import { CommandManagerService } from '../../services/command/command-manager.service';

const CanDeactivateBase = WithCanDeactivate(UnsavedDataTracker);

@Component({
  selector: 'app-template-edit',
  standalone: true,
  templateUrl: './template-edit.component.html',
  imports: [
    PageLayoutComponent,
    TemplateEditorContainerComponent,
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
export class TemplateEditComponent extends CanDeactivateBase implements OnInit {
  private route = inject(ActivatedRoute);
  private generalInfoFormService = inject(GeneralInfomationFormService);
  private templateApiService = inject(TemplateApiService);
  private canvasFacadeService = inject(CanvasFacadeService);
  private toastService = inject(ToastService);
  private errorMappingService = inject(ErrorMappingService);
  private fileUploadService = inject(FileUploadService);
  private frameRatioService = inject(FrameRatioService);
  private location = inject(Location);

  ICON_LEFT_OUTLINE = ICON_ARROW_LEFT_OUTLINE;
  templateId: number | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.templateId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.templateId) {
      this.loadTemplate();
    }
  }

  async editTemplate() {
    if (!this.templateId) return;

    if (this.generalInfoFormService.invalidForm()) {
      this.generalInfoFormService.markAllAsTouched();
      return;
    }

    // Check if there's at least one content block
    if (!this.canvasFacadeService.hasContentBlocks()) {
      this.toastService.error({ message: 'At least one content block is required.' });
      return;
    }

    const jsonFile = this.canvasFacadeService.exportTemplateToJson();
    const generalInfo = this.generalInfoFormService.getGeneralInfoFormValues();
    const thumbnailFile = await this.canvasFacadeService.generateThumbnailFile();
    const currentRatio = this.frameRatioService.getCurrentRatio();

    const payload: TemplateUpdateRequest = {
      templateId: this.templateId,
      jsonFile,
      ratio: currentRatio,
      ...generalInfo
    };

    this.fileUploadService
      .uploadFile(thumbnailFile, FileModule.BannerDesign)
      .pipe(
        map((res) => res.result),
        switchMap((thumbnail) => {
          return this.templateApiService.updateTemplate({
            ...payload,
            thumbnailFileId: thumbnail.id
          });
        })
      )
      .subscribe({
        next: () => {
          this.toastService.success({ message: 'Update template successfully' });

          this.generalInfoFormService.markAsPristine();
          this.goToPreviousPage();
        },
        error: (err) => {
          this.errorMappingService.toToast(err);
        }
      });
  }

  goToPreviousPage() {
    this.location.back();
  }

  override getFormGroup() {
    return this.generalInfoFormService.getForm();
  }

  private loadTemplate(): void {
    if (!this.templateId) return;

    this.isLoading = true;

    this.templateApiService.getTemplateById(this.templateId).subscribe({
      next: (response) => {
        const template = response.result;

        // Load general information into form
        this.generalInfoFormService.patchForm({
          name: template.name,
          description: template.description
        });

        this.frameRatioService.changeRatio(template.ratio);

        // Load JSON into canvas (delay to ensure canvas is initialized)
        setTimeout(() => {
          const jsonContent = template.templateContent.jsonFile;
          this.canvasFacadeService.loadTemplateFromJson(jsonContent);
          this.isLoading = false;
        }, 0);
      },
      error: (err) => {
        this.errorMappingService.toToast(err);
        this.isLoading = false;
      }
    });
  }
}
