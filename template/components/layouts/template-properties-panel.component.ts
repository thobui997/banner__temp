import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormFieldComponent } from '@gsf/admin/app/shared/components/form-field/form-field.component';
import {
  ButtonDirective,
  ICON_ARROW_LEFT_DOUBLE,
  ICON_BOLD_ARROW_DOWN,
  ICON_CLOSE,
  ICON_Drag_OUTLINE,
  ICON_EYE,
  IconSvgComponent,
  InputDirective
} from '@gsf/ui';
import { LayerManagementService } from '../../services/layers/layer-management.service';
import { Layer } from '../../types/layer.type';

@Component({
  selector: 'app-template-properties-panel',
  standalone: true,
  template: `
    <div class="w-[320px] h-full bg-white border border-stroke-primary-2">
      <div class="flex flex-col h-full">
        <!-- header -->
        <div class="flex items-center justify-end px-6 py-3">
          <button gsfButton appColor="tertiary" class="text-text-primary-2">
            <gsf-icon-svg [icon]="ICON_ARROW_LEFT_DOUBLE" />
          </button>
        </div>

        <!-- general inforrmation section -->
        <div class="px-6 pt-2">
          <details open>
            <summary>
              <div class="flex items-center gap-2 cursor-pointer">
                <gsf-icon-svg [icon]="ICON_BOLD_ARROW_DOWN" />
                <span class="text-text-primary-2 font-semibold">General Information</span>
              </div>
            </summary>

            <div class="py-4 flex flex-col gap-4">
              <gsf-form-field label="Template Name">
                <input slot="input" type="text" gsfInput placeholder="Enter Template Name" />
              </gsf-form-field>

              <gsf-form-field label="Description" class="">
                <textarea
                  slot="input"
                  gsfInput
                  placeholder="Enter Description"
                  rows="5"
                  class="resize-none"
                ></textarea>
              </gsf-form-field>
            </div>
          </details>
        </div>

        <!-- layer section -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="border-t border-b border-stroke-primary-2">
            <div class="px-6 py-[14px] font-semibold text-text-primary-2">Layers</div>
          </div>

          <div
            class="flex-1 flex-shrink-0 flex flex-col overflow-y-auto"
            cdkDropList
            (cdkDropListDropped)="onDrop($event)"
          >
            @for (layer of layers; track layer.id) {
              <div
                cdkDrag
                class="flex items-center justify-between px-2 py-[10px] hover:bg-fill-cta-others-hover"
                [class.bg-fill-cta-others-hover]="isSelected(layer.id)"
                (click)="selectLayer(layer.id)"
                (mouseenter)="hoverLayer(layer.id)"
                (mouseleave)="hoverLayer(null)"
              >
                <div class="flex gap-2 items-center">
                  <gsf-icon-svg
                    [icon]="ICON_Drag_OUTLINE"
                    class="text-text-primary-1 cursor-grab active:cursor-grabbing "
                    cdkDragHandle
                    [class.text-icon-disable]="layer.type === 'frame'"
                  />
                  <span>{{ layer.name }}</span>
                </div>

                <div class="flex items-center">
                  <button
                    gsfButton
                    appColor="tertiary"
                    appSize="lg"
                    class="p-1"
                    (click)="toggleVisibility(layer.id)"
                    [disabled]="layer.type === 'frame'"
                  >
                    <gsf-icon-svg [icon]="ICON_EYE" />
                  </button>
                  <button
                    gsfButton
                    appColor="tertiary"
                    appSize="lg"
                    class="p-1  text-icon-feature-icon-error-1"
                    (click)="deleteLayer(layer.id)"
                    [disabled]="layer.type === 'frame'"
                  >
                    <gsf-icon-svg [icon]="ICON_CLOSE" />
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,

  imports: [
    IconSvgComponent,
    ButtonDirective,
    FormFieldComponent,
    InputDirective,
    CdkDropList,
    CdkDrag
  ],
  styles: [
    `
      .cdk-drag-preview {
        opacity: 0.8;
      }

      .cdk-drag-placeholder {
        opacity: 0;
      }

      .cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
    `
  ]
})
export class TemplatePropertiesPanelComponent implements OnInit {
  private layerManagementService = inject(LayerManagementService);
  private destroyRef = inject(DestroyRef);

  ICON_ARROW_LEFT_DOUBLE = ICON_ARROW_LEFT_DOUBLE;
  ICON_BOLD_ARROW_DOWN = ICON_BOLD_ARROW_DOWN;
  ICON_Drag_OUTLINE = ICON_Drag_OUTLINE;
  ICON_EYE = ICON_EYE;
  ICON_CLOSE = ICON_CLOSE;

  items = Array.from({ length: 1 }, (_, i) => i);

  layers: Layer[] = [];
  selectedLayerId: string | null = null;

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
  }

  selectLayer(layerId: string): void {
    this.selectedLayerId = layerId;
    this.layerManagementService.selectLayer(layerId);
  }

  hoverLayer(layerId: string | null): void {
    this.layerManagementService.hoverLayer(layerId);
  }

  toggleVisibility(layerId: string): void {
    this.layerManagementService.toggleVisibility(layerId);
  }

  deleteLayer(layerId: string): void {
    this.layerManagementService.deleteLayer(layerId);
  }

  onDrop(event: CdkDragDrop<Layer[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      this.layerManagementService.reorderLayers(event.previousIndex, event.currentIndex);
    }
  }

  isSelected(layerId: string): boolean {
    return this.selectedLayerId === layerId;
  }

}
