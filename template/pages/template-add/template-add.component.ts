import { Component, inject } from '@angular/core';
import { UnsavedDataTracker } from '@gsf/admin/app/shared/base';
import { PageTitleComponent } from '@gsf/admin/app/shared/components';
import { FileModule } from '@gsf/admin/app/shared/enums';
import { PageLayoutComponent } from '@gsf/admin/app/shared/layouts';
import { WithCanDeactivate } from '@gsf/admin/app/shared/mixins';
import { CurrentUserInfoManagementService } from '@gsf/admin/app/shared/services';
import { FileUploadService } from '@gsf/admin/app/shared/services/api/file-upload.service';
import { ErrorMappingService } from '@gsf/admin/app/shared/services/error-mapping.service';
import { ButtonDirective, ICON_ARROW_LEFT_OUTLINE, IconSvgComponent, ToastService } from '@gsf/ui';
import { map, switchMap } from 'rxjs';
import { TemplateEditorContainerComponent } from '../../components/layouts/template-editor-container.component';
import { TemplateApiService } from '../../services/api/template-api.service';
import { CanvasEventHandlerService } from '../../services/canvas/canvas-event-handler.service';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { CanvasInitializationService } from '../../services/canvas/canvas-initialization.service';
import { SnapLineService } from '../../services/canvas/canvas-snap-line.service';
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
import { TemplateRequest } from '../../types/template.type';
import { CommandManagerService } from '../../services/command/command-manager.service';

const CanDeactivateBase = WithCanDeactivate(UnsavedDataTracker);

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
export class TemplateAddComponent extends CanDeactivateBase {
  private generalInfoFormService = inject(GeneralInfomationFormService);
  private templateApiService = inject(TemplateApiService);
  private canvasFacadeService = inject(CanvasFacadeService);
  private toastService = inject(ToastService);
  private errorMappingService = inject(ErrorMappingService);
  private currentUserInfoManagementService = inject(CurrentUserInfoManagementService);
  private fileUploadService = inject(FileUploadService);
  private frameRatioService = inject(FrameRatioService);

  ICON_LEFT_OUTLINE = ICON_ARROW_LEFT_OUTLINE;

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

    this.fileUploadService
      .uploadFile(thumbnailFile, FileModule.BannerDesign)
      .pipe(
        map((res) => res.result),
        switchMap((thumbnail) => {
          return this.templateApiService.createNewTemplate({
            ...payload,
            thumbnailFileId: thumbnail.id
          });
        })
      )
      .subscribe({
        next: () => {
          this.toastService.success({ message: 'Create template successfully' });

          this.generalInfoFormService.markAsPristine();
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

  override getFormGroup() {
    return this.generalInfoFormService.getForm();
  }
}
