import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '@gsf/admin/app/shared/components/form-field/form-field.component';
import {
    ButtonDirective,
    ICON_ARROW_LEFT_DOUBLE,
    ICON_BOLD_ARROW_DOWN,
    ICON_Drag_OUTLINE,
    ICON_EYE,
    ICON_EYE_OFF,
    IconSvgComponent,
    InputDirective
} from '@gsf/ui';
import { GeneralInfomationFormService } from '../../services/forms/general-information-form.service';
import { LayerManagementService } from '../../services/layers/layer-management.service';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';
import { Layer } from '../../types/layer.type';

@Component({
  selector: 'app-template-view-properties-panel',
  standalone: true,
  template: `
    <div class="w-[320px] h-full bg-white border border-stroke-primary-2">
      <div class="flex flex-col h-full">
        <!-- header -->
        <div class="flex items-center justify-end px-6 py-3">
          <button
            gsfButton
            appColor="tertiary"
            class="text-text-primary-2"
            (click)="closePanel()"
            title="Close left panel"
          >
            <gsf-icon-svg [icon]="ICON_ARROW_LEFT_DOUBLE" />
          </button>
        </div>

        <!-- general information section -->
        <div class="px-6 pt-2">
          <details open>
            <summary>
              <div class="flex items-center gap-2 cursor-pointer">
                <gsf-icon-svg [icon]="ICON_BOLD_ARROW_DOWN" />
                <span class="text-text-primary-2 font-semibold">General Information</span>
              </div>
            </summary>

            <form class="py-4 flex flex-col gap-4" [formGroup]="form">
              <gsf-form-field label="Template Name">
                <input
                  slot="input"
                  type="text"
                  gsfInput
                  formControlName="name"
                  readonly
                  class="bg-gray-50"
                />
              </gsf-form-field>

              <gsf-form-field label="Description">
                <textarea
                  slot="input"
                  gsfInput
                  rows="5"
                  class="resize-none bg-gray-50"
                  formControlName="description"
                  readonly
                ></textarea>
              </gsf-form-field>
            </form>
          </details>
        </div>

        <!-- layer section -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="border-t border-b border-stroke-primary-2">
            <div class="px-6 py-[14px] font-semibold text-text-primary-2">Layers</div>
          </div>

          <div class="flex-1 flex-shrink-0 flex flex-col overflow-y-auto">
            @for (layer of layers; track layer.id) {
              <div
                class="flex items-center justify-between px-2 py-[10px]"
                [class.bg-fill-cta-others-hover]="isSelected(layer.id)"
                (click)="selectLayer(layer.id)"
              >
                <div class="flex gap-2 items-center">
                  <gsf-icon-svg
                    [icon]="ICON_Drag_OUTLINE"
                    class="text-icon-disable cursor-not-allowed"
                  />
                  <span>{{ layer.name }}</span>
                </div>

                <div class="flex items-center">
                  <div class="p-1">
                    <gsf-icon-svg [icon]="layer.visible ? ICON_EYE : ICON_EYE_OFF" />
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  imports: [
    ReactiveFormsModule,
    IconSvgComponent,
    ButtonDirective,
    FormFieldComponent,
    InputDirective
  ]
})
export class TemplateViewPropertiesPanelComponent implements OnInit {
  private layerManagementService = inject(LayerManagementService);
  private destroyRef = inject(DestroyRef);
  private generalInfomationFormService = inject(GeneralInfomationFormService);
  private panelToggleService = inject(PanelToggleService);

  ICON_ARROW_LEFT_DOUBLE = ICON_ARROW_LEFT_DOUBLE;
  ICON_BOLD_ARROW_DOWN = ICON_BOLD_ARROW_DOWN;
  ICON_Drag_OUTLINE = ICON_Drag_OUTLINE;
  ICON_EYE = ICON_EYE;
  ICON_EYE_OFF = ICON_EYE_OFF;

  layers: Layer[] = [];
  selectedLayerId: string | null = null;
  form!: FormGroup;

  ngOnInit(): void {
    this.layerManagementService.layers$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((layers) => {
        this.layers = layers;
      });

    this.layerManagementService.selectedLayerId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((layerId) => {
        this.selectedLayerId = layerId;
      });

    this.form = this.generalInfomationFormService.createForm();
  }

  selectLayer(layerId: string): void {
    this.selectedLayerId = layerId;
    this.layerManagementService.selectLayer(layerId);
  }

  isSelected(layerId: string): boolean {
    return this.selectedLayerId === layerId;
  }

  closePanel(): void {
    this.panelToggleService.closeLeftPanel();
  }
}
