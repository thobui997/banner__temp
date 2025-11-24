import { Component, inject, OnInit } from '@angular/core';
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
import { TemplateRequest, TemplateUpdateRequest } from '../../types/template.type';
import { RatioEnum } from '../../enums/ratio.enum';
import { FileUploadService } from '@gsf/admin/app/shared/services/api/file-upload.service';
import { FileModule } from '@gsf/admin/app/shared/enums';
import { map, switchMap } from 'rxjs';
import { FrameManagementService } from '../../services/frame/frame-management.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ObjectDeserializerService } from '../../services/objects/object-deserializer.service';

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
    ObjectDeserializerService
  ]
})
export class TemplateEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private generalInfoFormService = inject(GeneralInfomationFormService);
  private templateApiService = inject(TemplateApiService);
  private canvasFacadeService = inject(CanvasFacadeService);
  private toastService = inject(ToastService);
  private errorMappingService = inject(ErrorMappingService);
  private fileUploadService = inject(FileUploadService);
  private router = inject(Router);

  ICON_LEFT_OUTLINE = ICON_ARROW_LEFT_OUTLINE;
  templateId: number | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.generalInfoFormService.createForm();

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

    const jsonFile = this.canvasFacadeService.exportTemplateToJson();
    const generalInfo = this.generalInfoFormService.getGeneralInfoFormValues();
    const thumbnailFile = await this.canvasFacadeService.generateThumbnailFile();

    const payload: TemplateUpdateRequest = {
      templateId: this.templateId,
      jsonFile,
      ratio: RatioEnum.Ratio1x2,
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

        // Load JSON into canvas (delay to ensure canvas is initialized)
        setTimeout(() => {
          const jsonContent = template.templateContent.jsonFile;
          this.canvasFacadeService.loadTemplateFromJson(jsonContent);
          this.isLoading = false;
        }, 500);
      },
      error: (err) => {
        this.errorMappingService.toToast(err);
        this.isLoading = false;
      }
    });
  }
}
