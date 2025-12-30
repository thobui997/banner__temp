import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  BasePropertiesComponent,
  ColorPickerComponent,
  PositionPropertiesComponent,
  PropertySectionComponent,
  ShapeControlComponent,
  SizeComponent,
  StyleControlComponent,
  TextAlignmentControlComponent,
  TextFontPropertiesComponent
} from '@gsf/admin/app/shared/components';
import { VariableType } from '@gsf/admin/app/shared/consts';
import {
  BasePropertiesService,
  ButtonPropertiesFormService,
  ButtonPropertyMapper,
  ButtonUpdateService,
  CanvasStateService,
  LayerManagementService,
  PanelToggleService,
  TransformObjectService
} from '@gsf/admin/app/shared/services';
import {
  ButtonProperties,
  ButtonPropertiesFormValues,
  ButtonShape,
  ButtonStyle,
  Position,
  TextAlignment
} from '@gsf/admin/app/shared/types';
import { ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent, InputDirective } from '@gsf/ui';
import { Group } from 'fabric';
import { filter } from 'rxjs';

@Component({
  selector: 'app-button-properties',
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
          <textarea
            gsfInput
            type="text"
            formControlName="text"
            rows="3"
            class="resize-none"
          ></textarea>
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
    TransformObjectService,
    ButtonUpdateService
  ]
})
export class ButtonPropertiesComponent
  extends BasePropertiesComponent<ButtonPropertiesFormService>
  implements OnInit
{
  protected formService = inject(ButtonPropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private mapper = inject(ButtonPropertyMapper);
  private panelToggleService = inject(PanelToggleService);
  private canvasStateService = inject(CanvasStateService);
  private layerManagementService = inject(LayerManagementService);
  private buttonUpdateService = inject(ButtonUpdateService);

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
    const groupObj = this.getActiveObject() as Group;
    if (groupObj) {
      this.textColorPresets = presets;
      this.buttonUpdateService.updateTextColorPreset(groupObj, presets);
    }
  }

  onBgPresetsChange(presets: Set<string>): void {
    if (this.isViewOnly) return;
    const groupObj = this.getActiveObject() as Group;
    if (groupObj) {
      this.bgColorPresets = presets;
      this.buttonUpdateService.updateBgColorPreset(groupObj, presets);
    }
  }

  protected initializeForm(): void {
    this.form = this.formService.createForm();
  }

  protected setupFormSubscriptions(): void {
    this.subscribeToControl(
      'position',
      (position: Partial<Position>) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          this.buttonUpdateService.updatePosition(groupObj, position);
        }
      },
      300,
      true
    );

    // Width
    this.subscribeToControl(
      'width',
      (width: number) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          this.buttonUpdateService.updateSize(groupObj, { width });
        }
      },
      300
    );

    // Height
    this.subscribeToControl(
      'height',
      (height: number) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          this.buttonUpdateService.updateSize(groupObj, { height });
        }
      },
      300
    );

    // Shape
    this.subscribeToControl(
      'shape',
      (shape: ButtonShape) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          this.buttonUpdateService.updateShape(groupObj, shape);
        }
      },
      0
    );

    // Button style
    this.subscribeToControl(
      'buttonStyle',
      (style: ButtonStyle) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          const buttonColor = this.form.get('buttonColor')?.value;
          this.buttonUpdateService.updateStyle(groupObj, style, buttonColor);
        }
      },
      0
    );

    // Button color
    this.subscribeToControl(
      'buttonColor',
      (color: string) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          this.buttonUpdateService.updateButtonColor(groupObj, color);
        }
      },
      300
    );

    // Text color
    this.subscribeToControl(
      'textColor',
      (color: string) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          this.buttonUpdateService.updateTextColor(groupObj, color);
        }
      },
      300
    );

    // Font family
    this.subscribeToControl(
      'fontFamily',
      (fontFamily: any) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          this.buttonUpdateService.updateTextFont(groupObj, {
            fontFamily: fontFamily?.[0]?.value
          });
        }
      },
      300,
      true
    );

    // Font weight
    this.subscribeToControl(
      'fontWeight',
      (fontWeight: any) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          this.buttonUpdateService.updateTextFont(groupObj, {
            fontWeight: fontWeight?.[0]?.value
          });
        }
      },
      300,
      true
    );

    // Font size
    this.subscribeToControl(
      'fontSize',
      (fontSize: any) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          this.buttonUpdateService.updateTextFont(groupObj, {
            fontSize: fontSize?.[0]?.value
          });
        }
      },
      300,
      true
    );

    // Text alignment
    this.subscribeToControl(
      'textAlignment',
      (alignment: TextAlignment) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          this.buttonUpdateService.updateTextAlignment(groupObj, alignment);
        }
      },
      0
    );

    // Text content
    this.subscribeToControl(
      'text',
      (text: string) => {
        const groupObj = this.getActiveObject() as Group;
        if (groupObj) {
          this.buttonUpdateService.updateTextContent(groupObj, text);
        }
      },
      300
    );
  }

  protected setupCanvasSubscriptions(): void {
    this.baseService.subscribeToCanvasChanges<ButtonProperties, ButtonPropertiesFormValues>(
      this.form,
      VariableType.BUTTON,
      (canvasProps) => {
        this.syncingFromCanvas = true;
        const formValues = this.mapper.toFormValues(canvasProps);
        this.syncingFromCanvas = false;
        return formValues;
      },
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

  protected getActiveObject() {
    const canvas = this.canvasStateService.getCanvas();
    const activeObject = canvas.getActiveObject();

    const metadata = activeObject?.get('customMetadata') as any;
    if (activeObject && metadata?.type === VariableType.BUTTON) {
      return activeObject;
    }

    return null;
  }
}
