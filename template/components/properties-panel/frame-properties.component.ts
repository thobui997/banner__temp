import { Component, inject } from '@angular/core';
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

@Component({
  selector: 'app-frame-properties',
  standalone: true,
  template: `
    <form class="flex flex-col h-full" [formGroup]="form">
      <!-- block name -->
      <div class="flex items-center gap-4 py-3 px-6">
        <button gsfButton appColor="tertiary" class="text-text-primary-2" (click)="closePanel()">
          <gsf-icon-svg [icon]="ICON_DOUBLE_ARROW_RIGHT" />
        </button>

        <span class="text-text-primary-2 text-lg font-semibold">Frame Properties</span>
      </div>

      <div class="flex-1 flex flex-col gap-5 overflow-y-auto py-2">
        <app-property-section label="Backgournd Color">
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
export class FramePropertiesComponent extends BasePropertiesComponent<FramePropertiesFormService> {
  protected formService = inject(FramePropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private canvasFacade = inject(CanvasFacadeService);
  private mapper = inject(FramePropertyMapper);
  private panelToggleService = inject(PanelToggleService);

  readonly ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  form!: FormGroup;
  bgColorPresets = new Set<string>(['#FFFFFF']);

  onBgPresetsChange(presets: Set<string>): void {
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
