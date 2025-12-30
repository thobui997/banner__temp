import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  BasePropertiesComponent,
  ColorPickerComponent,
  PropertySectionComponent
} from '@gsf/admin/app/shared/components';
import { VariableType } from '@gsf/admin/app/shared/consts';
import {
  BasePropertiesService,
  CanvasStateService,
  FramePropertiesFormService,
  FramePropertyMapper,
  FrameUpdateService,
  LayerManagementService,
  PanelToggleService,
  TransformObjectService
} from '@gsf/admin/app/shared/services';
import { FrameProperties } from '@gsf/admin/app/shared/types';
import { ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent } from '@gsf/ui';
import { Rect } from 'fabric';
import { filter } from 'rxjs';

@Component({
  selector: 'app-frame-properties',
  standalone: true,
  template: `
    <form class="flex flex-col h-full" [formGroup]="form">
      <!-- block name -->
      <div class="flex items-center gap-4 py-3 px-6">
        <button
          gsfButton
          appColor="tertiary"
          class="text-text-primary-2"
          type="button"
          (click)="closePanel()"
        >
          <gsf-icon-svg [icon]="ICON_DOUBLE_ARROW_RIGHT" />
        </button>

        <span class="text-text-primary-2 text-lg font-semibold line-clamp-1" [title]="layerName">
          {{ layerName }}
        </span>
      </div>

      <div class="flex-1 flex flex-col gap-5 overflow-y-auto py-2">
        <app-property-section label="Background Color">
          <app-color-picker
            formControlName="bgColor"
            [presets]="bgColorPresets"
            (presetsChange)="onBgPresetsChange($event)"
          />
        </app-property-section>
      </div>
    </form>
  `,
  imports: [ReactiveFormsModule, IconSvgComponent, PropertySectionComponent, ColorPickerComponent],
  providers: [
    FramePropertiesFormService,
    FramePropertyMapper,
    BasePropertiesService,
    TransformObjectService,
    FrameUpdateService
  ]
})
export class FramePropertiesComponent
  extends BasePropertiesComponent<FramePropertiesFormService>
  implements OnInit
{
  protected formService = inject(FramePropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private mapper = inject(FramePropertyMapper);
  private panelToggleService = inject(PanelToggleService);
  private canvasStateService = inject(CanvasStateService);
  private layerManagementService = inject(LayerManagementService);
  private frameUpdateService = inject(FrameUpdateService);

  readonly ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  form!: FormGroup;
  bgColorPresets = new Set<string>(['#FFFFFF']);
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

  onBgPresetsChange(presets: Set<string>): void {
    if (this.isViewOnly) return;
    const frame = this.getActiveObject() as Rect;
    if (frame) {
      this.bgColorPresets = presets;
      this.frameUpdateService.updateBgColorPreset(frame, presets);
    }
  }

  protected initializeForm(): void {
    this.form = this.formService.createForm();
  }

  protected setupFormSubscriptions(): void {
    // Debounced changes
    this.subscribeToControl(
      'bgColor',
      (color: string) => {
        const frame = this.getActiveObject() as Rect;
        if (frame) {
          this.frameUpdateService.updateBackgroundColor(frame, color);
        }
      },
      300
    );
  }

  protected setupCanvasSubscriptions(): void {
    this.baseService.subscribeToCanvasChanges<FrameProperties, FrameProperties>(
      this.form,
      VariableType.FRAME,
      (canvasProps) => {
        this.syncingFromCanvas = true;
        const formValues = this.mapper.toFormValues(canvasProps);
        this.syncingFromCanvas = false;
        return formValues;
      },
      (canvasProps) => {
        if (canvasProps.customData?.bgColorPreset) {
          this.bgColorPresets = canvasProps.customData.bgColorPreset;
        }
      }
    );
  }

  closePanel(): void {
    this.panelToggleService.closeRightPanel();
  }

  protected getActiveObject() {
    const canvas = this.canvasStateService.getCanvas();
    const activeObject = canvas.getActiveObject();

    const metadata = activeObject?.get('customMetadata') as any;
    if (activeObject && metadata?.type === VariableType.FRAME) {
      return activeObject;
    }

    return null;
  }
}
