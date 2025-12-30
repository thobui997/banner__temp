import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  BasePropertiesComponent,
  ColorPickerComponent,
  PositionPropertiesComponent,
  PropertySectionComponent,
  TextAlignmentControlComponent,
  TextFontPropertiesComponent
} from '@gsf/admin/app/shared/components';
import {
  BasePropertiesService,
  CanvasStateService,
  LayerManagementService,
  PanelToggleService,
  TextPropertiesFormService,
  TextPropertyMapper,
  TextUpdateService,
  TransformObjectService
} from '@gsf/admin/app/shared/services';
import {
  Position,
  TextAlignment,
  TextProperties,
  TextPropertiesFormValues
} from '@gsf/admin/app/shared/types';
import { ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent, InputDirective } from '@gsf/ui';
import { FabricObject, Textbox } from 'fabric';
import { filter } from 'rxjs';

@Component({
  selector: 'app-text-properties',
  standalone: true,
  template: `
    <form class="flex flex-col h-full" [formGroup]="form">
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
          <textarea gsfInput type="text" formControlName="text" rows="5" class="resize-none"></textarea>
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
    TransformObjectService,
    TextUpdateService
  ]
})
export class  TextPropertiesComponent
  extends BasePropertiesComponent<TextPropertiesFormService>
  implements OnInit
{
  protected formService = inject(TextPropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private canvasStateService = inject(CanvasStateService);
  private layerManagementService = inject(LayerManagementService);
  private mapper = inject(TextPropertyMapper);
  private panelToggleService = inject(PanelToggleService);
  private textUpdateService = inject(TextUpdateService);

  readonly ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  form!: FormGroup;
  colorPresets = new Set<string>(['#000000']);
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
    this.subscribeToControl(
      'position',
      (position: Partial<Position>) => {
        const textObj = this.getActiveObject() as Textbox;
        if (textObj) {
          this.textUpdateService.updatePosition(textObj, position);
        }
      },
      300,
      true
    );

    // Text color
    this.subscribeToControl('textColor', (color: string) => {
      const textObj = this.getActiveObject() as Textbox;
      if (textObj) {
        this.textUpdateService.updateColor(textObj, color);
      }
    });

    // Font family
    this.subscribeToControl(
      'fontFamily',
      (fontFamily: any) => {
        const textObj = this.getActiveObject() as Textbox;
        if (textObj) {
          this.textUpdateService.updateFont(textObj, {
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
        const textObj = this.getActiveObject() as Textbox;
        if (textObj) {
          this.textUpdateService.updateFont(textObj, {
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
        const textObj = this.getActiveObject() as Textbox;
        if (textObj) {
          this.textUpdateService.updateFont(textObj, {
            fontSize: fontSize?.[0]?.value
          });
        }
      },
      300,
      true
    );

    // Text alignment (no debounce - immediate)
    this.subscribeToControl(
      'textAlignment',
      (alignment: TextAlignment) => {
        const textObj = this.getActiveObject() as Textbox;
        if (textObj) {
          this.textUpdateService.updateAlignment(textObj, alignment);
        }
      },
      0
    );

    // Text content
    this.subscribeToControl('text', (text: string) => {
      const textObj = this.getActiveObject() as Textbox;
      if (textObj) {
        this.textUpdateService.updateContent(textObj, text);
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
    const textObj = this.getActiveObject() as Textbox;
    if (textObj) {
      this.colorPresets = presets;
      this.textUpdateService.updateColorPreset(textObj, presets);
    }
  }

  closePanel(): void {
    this.panelToggleService.closeRightPanel();
  }

  protected getActiveObject(): FabricObject | null {
    const canvas = this.canvasStateService.getCanvas();
    const activeObject = canvas.getActiveObject();

    if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
      return activeObject;
    }

    return null;
  }
}
