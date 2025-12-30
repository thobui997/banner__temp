import { Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageTitleComponent } from '@gsf/admin/app/shared/components';
import { FileModule } from '@gsf/admin/app/shared/enums';
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
import { FileUploadService } from '@gsf/admin/app/shared/services/api/file-upload.service';
import { ErrorMappingService } from '@gsf/admin/app/shared/services/error-mapping.service';
import { ButtonDirective, ICON_ARROW_LEFT_OUTLINE, IconSvgComponent, ToastService } from '@gsf/ui';
import { finalize, map, switchMap } from 'rxjs';
import { TemplateEditorContainerComponent } from '../../components/layouts/template-editor-container.component';
import { TemplateApiService } from '../../services/api/template-api.service';
import { TemplateUpdateRequest } from '../../types/template.type';
import { ConfirmLeaveBase } from '@gsf/admin/app/shared/base';

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
export class TemplateEditComponent extends ConfirmLeaveBase implements OnInit {
  private route = inject(ActivatedRoute);
  private generalInfoFormService = inject(GeneralInfomationFormService);
  private templateApiService = inject(TemplateApiService);
  private canvasFacadeService = inject(CanvasFacadeService);
  private toastService = inject(ToastService);
  private errorMappingService = inject(ErrorMappingService);
  private fileUploadService = inject(FileUploadService);
  private frameRatioService = inject(FrameRatioService);
  private location = inject(Location);
  private commandManager = inject(CommandManagerService);

  ICON_LEFT_OUTLINE = ICON_ARROW_LEFT_OUTLINE;
  templateId: number | null = null;

  isSubmitting = signal(false);

  ngOnInit(): void {
    this.templateId = Number(this.route.snapshot.paramMap.get('id'));
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

    this.isSubmitting.set(true);
    this.fileUploadService
      .uploadFile(thumbnailFile, FileModule.BannerDesign)
      .pipe(
        map((res) => res.result),
        switchMap((thumbnail) => {
          return this.templateApiService
            .updateTemplate({
              ...payload,
              thumbnailFileId: thumbnail.id
            })
            .pipe(
              finalize(() => {
                this.isSubmitting.set(false);
              })
            );
        })
      )
      .subscribe({
        next: () => {
          this.toastService.success({ message: 'Template updated successfully' });

          this.onSaveSuccess();
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

  loadTemplateData(): void {
    if (!this.templateId) {
      return;
    }

    this.templateApiService.getTemplateById(this.templateId).subscribe({
      next: (response) => {
        const template = response.result;

        // Load general information into form
        this.generalInfoFormService.patchForm({
          name: template.name,
          description: template.description
        });

        this.frameRatioService.changeRatio(template.ratio);

        // Load JSON into canvas - now canvas is ready
        setTimeout(async () => {
          const jsonContent = template.templateContent.jsonFile;
          await this.canvasFacadeService.loadTemplateFromJson(jsonContent);

          this.canvasFacadeService.resetViewport();
          this.canvasFacadeService.zoomToFit();
        }, 100);
      },
      error: (err) => {
        this.errorMappingService.toToast(err);
      }
    });
  }

  protected isDirty(): boolean {
    const form = this.generalInfoFormService.getForm();
    return !!form?.dirty || !this.commandManager.isClean();
  }

  protected markAsPristine(): void {
    const form = this.generalInfoFormService.getForm();
    form?.markAsPristine();
  }
}
