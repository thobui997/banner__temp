import { Component, inject, OnInit } from '@angular/core';
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
import { CanvasStateService } from '../../services/canvas/canvas-state.service';
import { LayerManagementService } from '../../services/layers/layer-management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'app-button-properties',
  standalone: true,
  template: `
    <form class="flex flex-col h-full" [formGroup]="form" (keydown.enter)="onEnterKey($event)">
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
export class ButtonPropertiesComponent
  extends BasePropertiesComponent<ButtonPropertiesFormService>
  implements OnInit
{
  protected formService = inject(ButtonPropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private canvasFacade = inject(CanvasFacadeService);
  private mapper = inject(ButtonPropertyMapper);
  private panelToggleService = inject(PanelToggleService);
  private canvasStateService = inject(CanvasStateService);
  private layerManagementService = inject(LayerManagementService);

  readonly ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  form!: FormGroup;
  textColorPresets = new Set<string>(['#FFFFFF']);
  bgColorPresets = new Set<string>(['#005AA9']);
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

  onTextPresetsChange(presets: Set<string>): void {
    if (this.isViewOnly) return;
    this.textColorPresets = presets;
    this.updateObject({ customData: { colorPreset: presets } });
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

  onEnterKey(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private updateObject(properties: Partial<ButtonProperties>): void {
    this.canvasFacade.updateButtonProperties(properties);
  }
}
