import { Component, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UploadAttachmentComponent } from '@gsf/admin/app/shared/components';
import { ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent } from '@gsf/ui';
import { VariableType } from '../../consts/variables.const';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { ImagePropertiesFormService } from '../../services/forms/image-properties-form.service';
import { ImagePropertyMapper } from '../../services/mappers/image-property-mapper.service';
import { BasePropertiesService } from '../../services/properties/base-properties.service';
import { TransformObjectService } from '../../services/transforms/transform-object.service';
import { ImageProperties } from '../../types/canvas-object.type';
import { AppearanceComponent } from '../object-controls/common/appearance.component';
import { PositionPropertiesComponent } from '../object-controls/common/position-properties.component';
import { PropertySectionComponent } from '../object-controls/common/property-section.component';
import { SizeComponent } from '../object-controls/common/size.component';
import { BasePropertiesComponent } from './base-properties.components';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';

@Component({
  selector: 'app-image-properties',
  standalone: true,
  template: `
    <form class="flex flex-col h-full" [formGroup]="form">
      <!-- block name -->
      <div class="flex items-center gap-4 py-3 px-6" (click)="closePanel()">
        <button gsfButton appColor="tertiary" class="text-text-primary-2">
          <gsf-icon-svg [icon]="ICON_DOUBLE_ARROW_RIGHT" />
        </button>

        <span class="text-text-primary-2 text-lg font-semibold">Image Block</span>
      </div>

      <div class="flex-1 flex flex-col gap-5 overflow-y-auto">
        <!-- position -->
        <app-property-section label="Position">
          <app-position-properties (align)="onAlign($event)" (transform)="onTransform($event)" />
        </app-property-section>

        <!-- image size -->
        <app-property-section label="Image Size">
          <app-size />
        </app-property-section>

        <app-property-section label="Appearance">
          <app-appearance />
        </app-property-section>

        <app-property-section label="Upload Image">
          <gsf-upload-attachment
            formControlName="attachments"
            [maxFiles]="1"
            [isMultipleUpload]="false"
            [acceptedFileTypes]="['.jpeg', '.jpg', '.png']"
          />
        </app-property-section>
      </div>
    </form>
  `,
  imports: [
    ReactiveFormsModule,
    IconSvgComponent,
    PropertySectionComponent,
    PositionPropertiesComponent,
    SizeComponent,
    AppearanceComponent,
    UploadAttachmentComponent
  ],
  providers: [
    ImagePropertiesFormService,
    ImagePropertyMapper,
    BasePropertiesService,
    TransformObjectService
  ]
})
export class ImagePropertiesComponent extends BasePropertiesComponent<ImagePropertiesFormService> {
  protected formService = inject(ImagePropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private canvasFacade = inject(CanvasFacadeService);
  private mapper = inject(ImagePropertyMapper);
  private panelToggleService = inject(PanelToggleService);

  readonly ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  form!: FormGroup;

  protected initializeForm(): void {
    this.form = this.formService.createForm();
  }

  protected setupFormSubscriptions(): void {
    // Debounced changes for most properties
    this.formService.subscribeToChanges((formValues) => {
      this.updateCanvas(formValues);
    });
  }

  protected setupCanvasSubscriptions(): void {
    this.baseService.subscribeToCanvasChanges<ImageProperties, ImageProperties>(
      this.form,
      VariableType.IMAGE,
      (canvasProps) => this.mapper.toFormValues(canvasProps)
    );
  }

  closePanel(): void {
    this.panelToggleService.closeRightPanel();
  }

  private updateCanvas(formValues: Partial<ImageProperties>): void {
    const canvasProps = this.mapper.toCanvasProperties(formValues);
    this.canvasFacade.updateImageProperties(canvasProps);
  }
}
