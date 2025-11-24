import { Component, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent } from '@gsf/ui';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { TextPropertiesFormService } from '../../services/forms/text-properties-form.service';
import { TextPropertyMapper } from '../../services/mappers/text-property-mapper.service';
import { BasePropertiesService } from '../../services/properties/base-properties.service';
import { TransformObjectService } from '../../services/transforms/transform-object.service';
import { TextProperties, TextPropertiesFormValues } from '../../types/canvas-object.type';
import { ColorPickerComponent } from '../object-controls/common/color-picker.component';
import { PositionPropertiesComponent } from '../object-controls/common/position-properties.component';
import { PropertySectionComponent } from '../object-controls/common/property-section.component';
import { TextAlignmentControlComponent } from '../object-controls/text/text-alignment-control.component';
import { TextFontPropertiesComponent } from '../object-controls/text/text-font-properties.component';
import { BasePropertiesComponent } from './base-properties.components';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';

@Component({
  selector: 'app-text-properties',
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

      <div class="flex-1 flex flex-col gap-5 overflow-y-auto">
        <!-- position -->
        <app-property-section label="Position">
          <app-position-properties (align)="onAlign($event)" (transform)="onTransform($event)" />
        </app-property-section>

        <!-- text color -->
        <app-property-section label="Text Color">
          <app-color-picker
            formControlName="textColor"
            [presets]="colorPresets"
            (presetsChange)="onPresetsChange($event)"
          />
        </app-property-section>

        <!-- text font -->
        <app-property-section label="Text Font">
          <app-text-font-properties />
        </app-property-section>

        <!-- alignment -->
        <app-property-section label="Alignment">
          <app-text-alignment formControlName="textAlignment" />
        </app-property-section>
      </div>
    </form>
  `,
  imports: [
    ReactiveFormsModule,
    IconSvgComponent,
    PropertySectionComponent,
    PositionPropertiesComponent,
    ColorPickerComponent,
    TextAlignmentControlComponent,
    TextFontPropertiesComponent
  ],
  providers: [
    TextPropertiesFormService,
    TextPropertyMapper,
    BasePropertiesService,
    TransformObjectService
  ]
})
export class TextPropertiesComponent extends BasePropertiesComponent<TextPropertiesFormService> {
  protected formService = inject(TextPropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private canvasFacadeService = inject(CanvasFacadeService);
  private mapper = inject(TextPropertyMapper);
  private panelToggleService = inject(PanelToggleService);

  readonly ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  form!: FormGroup;
  colorPresets = new Set<string>(['#000000']);
  private syncingFromCanvas = false;

  protected initializeForm(): void {
    this.form = this.formService.createForm();
  }

  protected setupFormSubscriptions(): void {
    // Debounced changes
    this.formService.subscribeToChanges((formValues) => {
      if (!this.syncingFromCanvas) {
        const canvasProps = this.mapper.toCanvasProperties(formValues);
        this.updateObject(canvasProps);
      }
    });
  }

  protected setupCanvasSubscriptions(): void {
    this.baseService.subscribeToCanvasChanges<TextProperties, TextPropertiesFormValues>(
      this.form,
      'text',
      (canvasProps) => this.mapper.toFormValues(canvasProps),
      (canvasProps) => {
        // Handle custom data (color presets)
        if (canvasProps.customData?.colorPreset) {
          this.colorPresets = canvasProps.customData.colorPreset;
        }
      }
    );
  }

  onPresetsChange(presets: Set<string>): void {
    this.colorPresets = presets;
    this.updateObject({ customData: { colorPreset: presets } });
  }

  closePanel(): void {
    this.panelToggleService.closeRightPanel();
  }

  private updateObject(values: Partial<TextProperties>): void {
    this.canvasFacadeService.updateObjectProperties(values);
  }
}
