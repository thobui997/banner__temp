import { Component, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent } from '@gsf/ui';
import { TextPropertiesFormService } from '../../services/forms/text-properties-form.service';
import { TextPropertyMapper } from '../../services/mappers/text-property-mapper.service';
import { BasePropertiesService } from '../../services/properties/base-properties.service';
import { TransformObjectService } from '../../services/transforms/transform-object.service';
import { TextProperties, TextPropertiesFormValues } from '../../types/canvas-object.type';
import { PropertySectionComponent } from '../object-controls/common/property-section.component';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';
import { InputDirective, InputGroupComponent } from '@gsf/ui';
import { BasePropertiesComponent } from '../properties-panel/base-properties.components';

@Component({
  selector: 'app-text-view-properties',
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
          <div class="grid grid-cols-2 gap-2" formGroupName="position">
            <gsf-input-group class="w-full" [appPrefix]="xPrefix">
              <input gsfInput appSize="sm" formControlName="x" class="w-full bg-gray-50" readonly />
            </gsf-input-group>

            <gsf-input-group class="w-full" [appPrefix]="yPrefix">
              <input gsfInput appSize="sm" formControlName="y" class="w-full bg-gray-50" readonly />
            </gsf-input-group>

            <gsf-input-group class="w-full" [appPrefix]="anglePrefix">
              <input
                gsfInput
                appSize="sm"
                formControlName="angle"
                class="w-full bg-gray-50"
                readonly
              />
            </gsf-input-group>
          </div>

          <ng-template #xPrefix>
            <span class="text-text-tertiary">X</span>
          </ng-template>
          <ng-template #yPrefix>
            <span class="text-text-tertiary">Y</span>
          </ng-template>
          <ng-template #anglePrefix>
            <span class="text-text-tertiary">°</span>
          </ng-template>
        </app-property-section>

        <!-- text color -->
        <app-property-section label="Text Color">
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded border border-gray-300"
              [style.background-color]="form.get('textColor')?.value"
            ></div>
            <span class="text-sm font-mono">{{ form.get('textColor')?.value }}</span>
          </div>
        </app-property-section>

        <!-- text font -->
        <app-property-section label="Text Font">
          <div class="flex flex-col gap-2">
            <input
              gsfInput
              [value]="form.get('fontFamily')?.value?.[0]?.name || 'N/A'"
              readonly
              class="bg-gray-50"
            />
            <div class="grid grid-cols-2 gap-2">
              <input
                gsfInput
                [value]="form.get('fontWeight')?.value?.[0]?.name || 'N/A'"
                readonly
                class="bg-gray-50"
              />
              <input
                gsfInput
                [value]="form.get('fontSize')?.value?.[0]?.name || 'N/A'"
                readonly
                class="bg-gray-50"
              />
            </div>
          </div>
        </app-property-section>

        <!-- alignment -->
        <app-property-section label="Alignment">
          <input
            gsfInput
            [value]="form.get('textAlignment')?.value"
            readonly
            class="bg-gray-50 capitalize"
          />
        </app-property-section>
      </div>
    </form>
  `,
  imports: [
    ReactiveFormsModule,
    IconSvgComponent,
    PropertySectionComponent,
    InputDirective,
    InputGroupComponent
  ],
  providers: [
    TextPropertiesFormService,
    TextPropertyMapper,
    BasePropertiesService,
    TransformObjectService
  ]
})
export class TextViewPropertiesComponent extends BasePropertiesComponent<TextPropertiesFormService> {
  protected formService = inject(TextPropertiesFormService);
  protected baseService = inject(BasePropertiesService);
  private mapper = inject(TextPropertyMapper);
  private panelToggleService = inject(PanelToggleService);

  readonly ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  form!: FormGroup;

  protected initializeForm(): void {
    this.form = this.formService.createForm();
    this.form.disable(); // Disable all controls for read-only
  }

  protected setupFormSubscriptions(): void {
    // No form subscriptions needed in view mode
  }

  protected setupCanvasSubscriptions(): void {
    this.baseService.subscribeToCanvasChanges<TextProperties, TextPropertiesFormValues>(
      this.form,
      'text',
      (canvasProps) => this.mapper.toFormValues(canvasProps)
    );
  }

  closePanel(): void {
    this.panelToggleService.closeRightPanel();
  }
}
