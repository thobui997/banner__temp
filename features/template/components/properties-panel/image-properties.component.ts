import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AppearanceComponent,
  BasePropertiesComponent,
  PositionPropertiesComponent,
  PropertySectionComponent,
  SizeComponent,
  UploadAttachmentComponent
} from '@gsf/admin/app/shared/components';
import { VariableType } from '@gsf/admin/app/shared/consts';
import {
  BasePropertiesService,
  CanvasStateService,
  ImagePropertiesFormService,
  ImagePropertyMapper,
  ImageUpdateService,
  LayerManagementService,
  PanelToggleService,
  TransformObjectService
} from '@gsf/admin/app/shared/services';
import { ImageProperties, Position } from '@gsf/admin/app/shared/types';
import { ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent } from '@gsf/ui';
import { Rect } from 'fabric';
import { filter } from 'rxjs';

@Component({
  selector: 'app-image-properties',
  standalone: true,
  template: `
    <form class="flex flex-col h-full" [formGroup]="form" (keydown.enter)="onEnterKey($event)">
      <!-- block name -->
      <div class="flex items-center gap-4 py-3 px-6" (click)="closePanel()">
        <button gsfButton appColor="tertiary" class="text-text-primary-2" type="button">
          <gsf-icon-svg [icon]="ICON_DOUBLE_ARROW_RIGHT" />
        </button>

        <span class="text-text-primary-2 text-lg font-semibold line-clamp-1" [title]="layerName">
          {{ layerName }}
        </span>
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
            unsupportedMessage="Unsupported file type. Please upload a file in .png, .jpg, .jpeg, .svg format."
            [maxFiles]="1"
            [isMultipleUpload]="false"
            [acceptedFileTypes]="['.jpeg', '.jpg', '.png', '.svg']"
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
    TransformObjectService,
    ImageUpdateService
  ]
})
export class ImagePropertiesComponent
  extends BasePropertiesComponent<ImagePropertiesFormService>
  implements OnInit
{
  protected formService = inject(ImagePropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private mapper = inject(ImagePropertyMapper);
  private panelToggleService = inject(PanelToggleService);
  private canvasStateService = inject(CanvasStateService);
  private layerManagementService = inject(LayerManagementService);
  private imageUpdateService = inject(ImageUpdateService);

  readonly ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  form!: FormGroup;
  layerName = '';
  private currentLayerId = '';

  override ngOnInit(): void {
    super.ngOnInit();

    // Subscribe to selected object to get initial layer name
    this.canvasStateService.selectedObject$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((obj) => {
        if (obj) {
          const metadata = obj.get('customMetadata') as any;
          this.currentLayerId = metadata?.id || '';
          this.layerName = metadata?.customName;
        }
      });

    // Subscribe to layer name changes
    this.layerManagementService.layerNameChanged$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((change) => change !== null && change.layerId === this.currentLayerId)
      )
      .subscribe((change) => {
        if (change) {
          this.layerName = change.name;
        }
      });
  }

  protected initializeForm(): void {
    this.form = this.formService.createForm();
  }

  protected setupFormSubscriptions(): void {
    // Position
    this.subscribeToControl(
      'position',
      (position: Partial<Position>) => {
        const imageRect = this.getActiveObject() as Rect;
        if (imageRect) {
          this.imageUpdateService.updatePosition(imageRect, position);
        }
      },
      300,
      true
    );

    // Width
    this.subscribeToControl(
      'width',
      (width: number) => {
        const imageRect = this.getActiveObject() as Rect;
        if (imageRect) {
          this.imageUpdateService.updateSize(imageRect, { width });
        }
      },
      300
    );

    // Height
    this.subscribeToControl(
      'height',
      (height: number) => {
        const imageRect = this.getActiveObject() as Rect;
        if (imageRect) {
          this.imageUpdateService.updateSize(imageRect, { height });
        }
      },
      300
    );

    // Corner radius
    this.subscribeToControl(
      'cornerRadius',
      (radius: number) => {
        const imageRect = this.getActiveObject() as Rect;
        if (imageRect) {
          this.imageUpdateService.updateCornerRadius(imageRect, radius);
        }
      },
      300
    );

    // Opacity
    this.subscribeToControl(
      'opacity',
      (opacity) => {
        const imageRect = this.getActiveObject() as Rect;
        if (imageRect) {
          this.imageUpdateService.updateOpacity(imageRect, Number(opacity) / 100);
        }
      },
      300
    );

    // Attachments (image source)
    this.subscribeToControl(
      'attachments',
      (attachments: any) => {
        const imageRect = this.getActiveObject() as Rect;
        if (imageRect) {
          this.imageUpdateService.updateSource(imageRect, attachments);
        }
      },
      0
    ); // No debounce for image upload
  }

  protected setupCanvasSubscriptions(): void {
    this.baseService.subscribeToCanvasChanges<ImageProperties, ImageProperties>(
      this.form,
      VariableType.IMAGE,
      (canvasProps) => {
        this.syncingFromCanvas = true;
        const formValues = this.mapper.toFormValues(canvasProps);
        this.syncingFromCanvas = false;
        return formValues;
      }
    );
  }

  closePanel(): void {
    this.panelToggleService.closeRightPanel();
  }

  onEnterKey(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected getActiveObject() {
    const canvas = this.canvasStateService.getCanvas();
    const activeObject = canvas.getActiveObject();

    const metadata = activeObject?.get('customMetadata') as any;
    if (activeObject && metadata?.type === VariableType.IMAGE) {
      return activeObject;
    }

    return null;
  }
}
