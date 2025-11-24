import { Component, inject } from '@angular/core';
import { PageTitleComponent } from '@gsf/admin/app/shared/components';
import { PageLayoutComponent } from '@gsf/admin/app/shared/layouts';
import { CurrentUserInfoManagementService } from '@gsf/admin/app/shared/services';
import { ErrorMappingService } from '@gsf/admin/app/shared/services/error-mapping.service';
import { ButtonDirective, ICON_ARROW_LEFT_OUTLINE, IconSvgComponent, ToastService } from '@gsf/ui';
import { TemplateEditorContainerComponent } from '../../components/layouts/template-editor-container.component';
import { TemplateApiService } from '../../services/api/template-api.service';
import { CanvasEventHandlerService } from '../../services/canvas/canvas-event-handler.service';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { CanvasInitializationService } from '../../services/canvas/canvas-initialization.service';
import { CanvasStateService } from '../../services/canvas/canvas-state.service';
import { GeneralInfomationFormService } from '../../services/forms/general-information-form.service';
import { LayerManagementService } from '../../services/layers/layer-management.service';
import { ObjectCreationService } from '../../services/objects/object-creation.service';
import { ObjectPropertiesExtractorService } from '../../services/objects/object-properties-extractor.service';
import { ObjectUpdateService } from '../../services/objects/object-update.service';
import { TemplateRequest } from '../../types/template.type';
import { RatioEnum } from '../../enums/ratio.enum';
import { FileUploadService } from '@gsf/admin/app/shared/services/api/file-upload.service';
import { FileModule } from '@gsf/admin/app/shared/enums';
import { map, switchMap } from 'rxjs';

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
    TemplateApiService
  ]
})
export class TemplateAddComponent {
  private generalInfoFormService = inject(GeneralInfomationFormService);
  private templateApiService = inject(TemplateApiService);
  private canvasFacadeService = inject(CanvasFacadeService);
  private toastService = inject(ToastService);
  private errorMappingService = inject(ErrorMappingService);
  private currentUserInfoManagementService = inject(CurrentUserInfoManagementService);
  private fileUploadService = inject(FileUploadService);

  ICON_LEFT_OUTLINE = ICON_ARROW_LEFT_OUTLINE;

  async createTemplate() {
    const currentCampus = this.currentUserInfoManagementService.getCampusId();
    if (!currentCampus) return;

    if (this.generalInfoFormService.invalidForm()) {
      this.generalInfoFormService.markAllAsTouched();
      return;
    }

    const json = this.canvasFacadeService.exportTemplateToJson();
    const generalInfo = this.generalInfoFormService.getGeneralInfoFormValues();
    const thumbnailFile = await this.canvasFacadeService.generateThumbnailFile();

    const payload: TemplateRequest = {
      campusId: currentCampus,
      jsonFile: JSON.stringify(json),
      ratio: RatioEnum.Ratio1x2,
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
        },
        error: (err) => {
          this.errorMappingService.toToast(err);
        }
      });
  }
}
