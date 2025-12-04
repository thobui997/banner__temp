import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent } from '@gsf/ui';
import { VariableType } from '../../consts/variables.const';
import { BasePropertiesService } from '../../services/properties/base-properties.service';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { FramePropertiesFormService } from '../../services/forms/frame-properties-form.service';
import { FrameProperties } from '../../types/canvas-object.type';
import { BasePropertiesComponent } from './base-properties.components';
import { ColorPickerComponent } from '../object-controls/common/color-picker.component';
import { PropertySectionComponent } from '../object-controls/common/property-section.component';
import { FramePropertyMapper } from '../../services/mappers/frame-property-mapper.service';
import { TransformObjectService } from '../../services/transforms/transform-object.service';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';
import { CanvasStateService } from '../../services/canvas/canvas-state.service';
import { LayerManagementService } from '../../services/layers/layer-management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    TransformObjectService
  ]
})
export class FramePropertiesComponent
  extends BasePropertiesComponent<FramePropertiesFormService>
  implements OnInit
{
  protected formService = inject(FramePropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private canvasFacade = inject(CanvasFacadeService);
  private mapper = inject(FramePropertyMapper);
  private panelToggleService = inject(PanelToggleService);
  private canvasStateService = inject(CanvasStateService);
  private layerManagementService = inject(LayerManagementService);

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
    this.bgColorPresets = presets;
    this.updateObject({ customData: { bgColorPreset: presets } });
  }

  protected initializeForm(): void {
    this.form = this.formService.createForm();
  }

  protected setupFormSubscriptions(): void {
    // Debounced changes
    this.formService.subscribeToChanges((formValues) => {
      const canvasProps = this.mapper.toCanvasProperties(formValues);
      this.updateObject(canvasProps);
    });
  }

  protected setupCanvasSubscriptions(): void {
    this.baseService.subscribeToCanvasChanges<FrameProperties, FrameProperties>(
      this.form,
      VariableType.FRAME,
      (canvasProps) => this.mapper.toFormValues(canvasProps),
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

  private updateObject(properties: Partial<FrameProperties>): void {
    this.canvasFacade.updateFrameProperties(properties);
  }
}
