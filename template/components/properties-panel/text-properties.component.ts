import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent, InputDirective } from '@gsf/ui';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { TextPropertiesFormService } from '../../services/forms/text-properties-form.service';
import { TextPropertyMapper } from '../../services/mappers/text-property-mapper.service';
import { BasePropertiesService } from '../../services/properties/base-properties.service';
import { TransformObjectService } from '../../services/transforms/transform-object.service';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';
import { TextProperties, TextPropertiesFormValues } from '../../types/canvas-object.type';
import { ColorPickerComponent } from '../object-controls/common/color-picker.component';
import { PositionPropertiesComponent } from '../object-controls/common/position-properties.component';
import { PropertySectionComponent } from '../object-controls/common/property-section.component';
import { TextAlignmentControlComponent } from '../object-controls/text/text-alignment-control.component';
import { TextFontPropertiesComponent } from '../object-controls/text/text-font-properties.component';
import { BasePropertiesComponent } from './base-properties.components';
import { CanvasStateService } from '../../services/canvas/canvas-state.service';
import { LayerManagementService } from '../../services/layers/layer-management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'app-text-properties',
  standalone: true,
  template: `
    <form class="flex flex-col h-full" [formGroup]="form" (keydown.enter)="onEnterKey($event)">
      <!-- block name -->
      <div class="flex items-center gap-4 py-3 px-6">
        <button
          gsfButton
          appColor="tertiary"
          type="button"
          class="text-text-primary-2"
          (click)="closePanel()"
        >
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

        <app-property-section label="Text">
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
    ColorPickerComponent,
    TextAlignmentControlComponent,
    TextFontPropertiesComponent,
    InputDirective
  ],
  providers: [
    TextPropertiesFormService,
    TextPropertyMapper,
    BasePropertiesService,
    TransformObjectService
  ]
})
export class TextPropertiesComponent
  extends BasePropertiesComponent<TextPropertiesFormService>
  implements OnInit
{
  protected formService = inject(TextPropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private canvasFacadeService = inject(CanvasFacadeService);
  private canvasStateService = inject(CanvasStateService);
  private layerManagementService = inject(LayerManagementService);
  private mapper = inject(TextPropertyMapper);
  private panelToggleService = inject(PanelToggleService);

  readonly ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  form!: FormGroup;
  colorPresets = new Set<string>(['#000000']);
  layerName = '';
  private currentLayerId = '';
  private syncingFromCanvas = false;

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
      (canvasProps) => {
        this.syncingFromCanvas = true;
        const formValues = this.mapper.toFormValues(canvasProps);
        this.syncingFromCanvas = false;
        return formValues;
      },
      (canvasProps) => {
        // Handle custom data (color presets)
        if (canvasProps.customData?.colorPreset) {
          this.colorPresets = canvasProps.customData.colorPreset;
        }
      }
    );
  }

  onPresetsChange(presets: Set<string>): void {
    if (this.isViewOnly) return;
    this.colorPresets = presets;
    this.updateObject({ customData: { colorPreset: presets } });
  }

  closePanel(): void {
    this.panelToggleService.closeRightPanel();
  }

  onEnterKey(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private updateObject(values: Partial<TextProperties>): void {
    this.canvasFacadeService.updateObjectProperties(values);
  }
}
