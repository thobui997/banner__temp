import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormFieldErrorComponent } from '@gsf/admin/app/shared/components/form-field-error/form-field-error.component';
import { FormFieldComponent } from '@gsf/admin/app/shared/components/form-field/form-field.component';
import {
  ButtonDirective,
  ICON_ARROW_LEFT_DOUBLE,
  ICON_BOLD_ARROW_DOWN,
  ICON_CLOSE,
  ICON_DRAG_OUTLINE_2,
  ICON_EDIT_2_OUTLINE,
  ICON_EYE,
  ICON_EYE_OFF,
  IconSvgComponent,
  InputDirective
} from '@gsf/ui';
import { DeleteLayerCommand } from '../../commands/delete-layer.command';
import { RenameLayerCommand } from '../../commands/rename-layer.command';
import { ReorderLayerCommand } from '../../commands/reorder-layer.command';
import { ToggleLayerVisibilityCommand } from '../../commands/toggle-layer-visibility.command';
import { CanvasStateService } from '../../services/canvas/canvas-state.service';
import { CommandManagerService } from '../../services/command/command-manager.service';
import { GeneralInfomationFormService } from '../../services/forms/general-information-form.service';
import { LayerManagementService } from '../../services/layers/layer-management.service';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';
import { Layer } from '../../types/layer.type';

@Component({
  selector: 'app-template-properties-panel',
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
              <gsf-form-field label="Template Name" [required]="true">
                <input
                  slot="input"
                  type="text"
                  gsfInput
                  placeholder="Enter Template Name"
                  formControlName="name"
                  maxlength="50"
                />
                <app-form-field-error slot="error" [control]="form.get('name')" />
              </gsf-form-field>

              <gsf-form-field label="Description" class="">
                <textarea
                  slot="input"
                  gsfInput
                  placeholder="Enter Description"
                  rows="5"
                  class="resize-none"
                  formControlName="description"
                  maxlength="250"
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

          <div
            class="flex-1 flex-shrink-0 flex flex-col overflow-y-auto"
            cdkDropList
            (cdkDropListDropped)="onDrop($event)"
          >
            @for (layer of layers; track layer.id) {
              <div
                cdkDrag
                class="flex items-center justify-between px-2 py-[10px] hover:bg-fill-cta-others-hover group"
                [class.bg-fill-cta-others-hover]="isSelected(layer.id)"
                (click)="selectLayer(layer.id)"
                (mouseenter)="hoverLayer(layer.id)"
                (mouseleave)="hoverLayer(null)"
              >
                <div class="flex gap-2 items-center flex-1 min-w-0">
                  <gsf-icon-svg
                    [icon]="ICON_Drag_OUTLINE"
                    class="text-text-primary-1 cursor-grab active:cursor-grabbing flex-shrink-0"
                    cdkDragHandle
                    [class.text-icon-disable]="layer.type === 'frame'"
                  />

                  @if (layer.isEditingName) {
                    <input
                      #layerNameInput
                      type="text"
                      class="flex-1 px-2 py-1 text-sm border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      maxlength="50"
                      [value]="layer.name"
                      (click)="$event.stopPropagation()"
                      (blur)="finishEditingLayerName(layer, $event)"
                      (keydown.enter)="finishEditingLayerName(layer, $event)"
                      (keydown.escape)="cancelEditingLayerName(layer)"
                    />
                  } @else {
                    <span class="truncate text-sm" [title]="layer.name">{{ layer.name }}</span>
                  }
                </div>

                <div class="flex items-center flex-shrink-0">
                  @if (!layer.isEditingName) {
                    <button
                      gsfButton
                      appColor="tertiary"
                      appSize="lg"
                      class="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      (click)="startEditingLayerName(layer, $event)"
                      title="Rename layer"
                    >
                      <gsf-icon-svg [icon]="ICON_EDIT_2_OUTLINE" />
                    </button>
                  }

                  <button
                    gsfButton
                    appColor="tertiary"
                    appSize="lg"
                    class="p-1"
                    (click)="toggleVisibility(layer.id, $event)"
                    [class.hidden]="layer.type === 'frame'"
                  >
                    <gsf-icon-svg [icon]="layer.visible ? ICON_EYE : ICON_EYE_OFF" />
                  </button>

                  <button
                    gsfButton
                    appColor="tertiary"
                    appSize="lg"
                    class="p-1 text-icon-feature-icon-error-1"
                    (click)="deleteLayer(layer.id, $event)"
                    [class.hidden]="layer.type === 'frame'"
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
    ReactiveFormsModule,
    IconSvgComponent,
    ButtonDirective,
    FormFieldComponent,
    InputDirective,
    CdkDropList,
    CdkDrag,
    FormFieldErrorComponent
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
  private commandManager = inject(CommandManagerService);
  private canvasStateService = inject(CanvasStateService);
  private generalInfomationFormService = inject(GeneralInfomationFormService);
  private panelToggleService = inject(PanelToggleService);

  ICON_ARROW_LEFT_DOUBLE = ICON_ARROW_LEFT_DOUBLE;
  ICON_BOLD_ARROW_DOWN = ICON_BOLD_ARROW_DOWN;
  ICON_Drag_OUTLINE = ICON_DRAG_OUTLINE_2;
  ICON_EYE = ICON_EYE;
  ICON_EYE_OFF = ICON_EYE_OFF;
  ICON_CLOSE = ICON_CLOSE;
  ICON_EDIT_2_OUTLINE = ICON_EDIT_2_OUTLINE;

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

  hoverLayer(layerId: string | null): void {
    this.layerManagementService.hoverLayer(layerId);
  }

  toggleVisibility(layerId: string, event: Event): void {
    event.stopPropagation();
    const command = new ToggleLayerVisibilityCommand(this.layerManagementService, layerId);
    this.commandManager.execute(command);
  }

  deleteLayer(layerId: string, event: Event): void {
    event.stopPropagation();
    const canvas = this.canvasStateService.getCanvas();
    const command = new DeleteLayerCommand(this.layerManagementService, canvas, layerId);
    this.commandManager.execute(command);
  }

  onDrop(event: CdkDragDrop<Layer[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      if (this.isFrame(this.layers[event.previousIndex].id)) {
        return;
      }

      const command = new ReorderLayerCommand(
        this.layerManagementService,
        event.previousIndex,
        event.currentIndex
      );

      this.commandManager.execute(command);
    }
  }

  startEditingLayerName(layer: Layer, event: Event): void {
    event.stopPropagation();
    layer.isEditingName = true;

    // Focus input after render
    setTimeout(() => {
      const input = document.querySelector(`input[value="${layer.name}"]`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  finishEditingLayerName(layer: Layer, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newName = input.value.trim();

    if (newName && newName !== layer.name) {
      const command = new RenameLayerCommand(
        this.layerManagementService,
        layer.id,
        layer.name,
        newName
      );
      this.commandManager.execute(command);
    }

    layer.isEditingName = false;
  }

  cancelEditingLayerName(layer: Layer): void {
    layer.isEditingName = false;
  }

  isSelected(layerId: string): boolean {
    return this.selectedLayerId === layerId;
  }

  isFrame(layerId: string): boolean {
    return this.layerManagementService.isFrameLayer(layerId);
  }

  closePanel(): void {
    this.panelToggleService.closeLeftPanel();
  }
}
