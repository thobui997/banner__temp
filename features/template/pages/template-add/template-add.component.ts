import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  CurrentUserInfoManagementService,
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
import {
  ButtonDirective,
  ICON_ARROW_LEFT_OUTLINE,
  IconSvgComponent,
  ToastService
} from '@gsf/ui';
import { finalize, map, switchMap } from 'rxjs';
import { TemplateEditorContainerComponent } from '../../components/layouts/template-editor-container.component';
import { TemplateApiService } from '../../services/api/template-api.service';
import { TemplateRequest } from '../../types/template.type';
import { ConfirmLeaveBase } from '@gsf/admin/app/shared/base';

@Component({
  selector: 'app-template-add',
  standalone: true,
  templateUrl: './template-add.component.html',
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
export class TemplateAddComponent extends ConfirmLeaveBase {
  private generalInfoFormService = inject(GeneralInfomationFormService);
  private templateApiService = inject(TemplateApiService);
  private canvasFacadeService = inject(CanvasFacadeService);
  private toastService = inject(ToastService);
  private errorMappingService = inject(ErrorMappingService);
  private currentUserInfoManagementService = inject(CurrentUserInfoManagementService);
  private fileUploadService = inject(FileUploadService);
  private frameRatioService = inject(FrameRatioService);
  private router = inject(Router);
  private commandManager = inject(CommandManagerService);

  ICON_LEFT_OUTLINE = ICON_ARROW_LEFT_OUTLINE;

  isSubmitting = signal(false);

  async createTemplate() {
    const currentCampus = this.currentUserInfoManagementService.getCampusId();
    if (!currentCampus) return;

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

    const payload: TemplateRequest = {
      campusId: currentCampus,
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
            .createNewTemplate({
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
          this.toastService.success({ message: 'Template created successfully' });
          this.onSaveSuccess();
          this.goToList();
        },
        error: (err) => {
          this.errorMappingService.toToast(err);
        }
      });
  }

  goToList() {
    this.router.navigateByUrl('/template');
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
