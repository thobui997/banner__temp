import { Component, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent, InputDirective } from '@gsf/ui';
import { VariableType } from '../../consts/variables.const';
import { BasePropertiesService } from '../../services/properties/base-properties.service';
import { ButtonPropertiesFormService } from '../../services/forms/button-properties-form.service';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { ButtonProperties, ButtonPropertiesFormValues } from '../../types/canvas-object.type';
import { BasePropertiesComponent } from './base-properties.components';
import { ColorPickerComponent } from '../object-controls/common/color-picker.component';
import { PositionPropertiesComponent } from '../object-controls/common/position-properties.component';
import { PropertySectionComponent } from '../object-controls/common/property-section.component';
import { ShapeControlComponent } from '../object-controls/shape/shape-control.component';
import { SizeComponent } from '../object-controls/common/size.component';
import { StyleControlComponent } from '../object-controls/common/style-control.component';
import { TextAlignmentControlComponent } from '../object-controls/text/text-alignment-control.component';
import { TextFontPropertiesComponent } from '../object-controls/text/text-font-properties.component';
import { ButtonPropertyMapper } from '../../services/mappers/button-property-mapper.service';
import { TransformObjectService } from '../../services/transforms/transform-object.service';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';

@Component({
  selector: 'app-button-properties',
  standalone: true,
  template: `
    <form class="flex flex-col h-full" [formGroup]="form">
      <!-- block name -->
      <div class="flex items-center gap-4 py-3 px-6">
        <button gsfButton appColor="tertiary" class="text-text-primary-2" (click)="closePanel()">
          <gsf-icon-svg [icon]="ICON_DOUBLE_ARROW_RIGHT" />
        </button>

        <span class="text-text-primary-2 text-lg font-semibold">{{ form.get('text')?.value }}</span>
      </div>

      <div class="flex-1 flex flex-col gap-5 overflow-y-auto py-2">
        <!-- position -->
        <app-property-section label="Position">
          <app-position-properties (align)="onAlign($event)" (transform)="onTransform($event)" />
        </app-property-section>

        <app-property-section label="Button Size">
          <app-size />
        </app-property-section>

        <app-property-section label="Shape">
          <app-shape-control formControlName="shape" />
        </app-property-section>

        <app-property-section label="Style">
          <app-style-control formControlName="buttonStyle" />
        </app-property-section>

        <app-property-section label="Button Color">
          <app-color-picker
            formControlName="buttonColor"
            [presets]="bgColorPresets"
            (presetsChange)="onBgPresetsChange($event)"
          />
        </app-property-section>

        <app-property-section label="Text Font">
          <app-text-font-properties />
        </app-property-section>

        <app-property-section label="Text Color">
          <app-color-picker
            formControlName="textColor"
            [presets]="textColorPresets"
            (presetsChange)="onTextPresetsChange($event)"
          />
        </app-property-section>

        <app-property-section label="Text Alignment">
          <app-text-alignment formControlName="textAlignment" />
        </app-property-section>

        <app-property-section label="Button Text">
          <input gsfInput type="text" formControlName="text" />
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
    TextAlignmentControlComponent,
    ColorPickerComponent,
    TextFontPropertiesComponent,
    ShapeControlComponent,
    StyleControlComponent,
    InputDirective
  ],
  providers: [
    ButtonPropertiesFormService,
    ButtonPropertyMapper,
    BasePropertiesService,
    TransformObjectService
  ]
})
export class ButtonPropertiesComponent extends BasePropertiesComponent<ButtonPropertiesFormService> {
  protected formService = inject(ButtonPropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private canvasFacade = inject(CanvasFacadeService);
  private mapper = inject(ButtonPropertyMapper);
  private panelToggleService = inject(PanelToggleService);

  readonly ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  form!: FormGroup;
  textColorPresets = new Set<string>(['#FFFFFF']);
  bgColorPresets = new Set<string>(['#764FDB']);

  onTextPresetsChange(presets: Set<string>): void {
    this.textColorPresets = presets;
    this.updateObject({ customData: { colorPreset: presets } });
  }

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
    this.baseService.subscribeToCanvasChanges<ButtonProperties, ButtonPropertiesFormValues>(
      this.form,
      VariableType.BUTTON,
      (canvasProps) => this.mapper.toFormValues(canvasProps),
      (canvasProps) => {
        if (canvasProps.customData?.colorPreset) {
          this.textColorPresets = canvasProps.customData.colorPreset;
        }

        if (canvasProps.customData?.bgColorPreset) {
          this.bgColorPresets = canvasProps.customData.bgColorPreset;
        }
      }
    );
  }

  closePanel(): void {
    this.panelToggleService.closeRightPanel();
  }

  private updateObject(properties: Partial<ButtonProperties>): void {
    this.canvasFacade.updateButtonProperties(properties);
  }
}
