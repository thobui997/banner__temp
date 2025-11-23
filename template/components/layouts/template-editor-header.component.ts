import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { WrapOverlayComponent } from '@gsf/admin/app/shared/components';
import { OverlayTriggerDirective } from '@gsf/admin/app/shared/directives';
import {
  ButtonDirective,
  ICON_ARROW_LEFT_DOUBLE,
  ICON_DOUBLE_ARROW_RIGHT,
  ICON_MAGIC_PEN,
  ICON_REDO,
  ICON_UNDO,
  IconSvgComponent
} from '@gsf/ui';
import { DEFAULT_IMAGE_URL, variables } from '../../consts/variables.const';
import { Variable, VariableType } from '../../types/variable.type';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';

@Component({
  selector: 'app-template-editor-header',
  standalone: true,
  template: `
    <div class="flex gap-4 items-center bg-white py-3 px-4 border-b border-stroke-primary-2">
      <button gsfButton appColor="tertiary" class="text-text-primary-2">
        <gsf-icon-svg [icon]="ICON_ARROW_LEFT_DOUBLE" />
      </button>

      <ng-container [ngTemplateOutlet]="sepratorTmpl" />

      <div class="flex-1 flex items-center justify-between">
        <button
          gsfButton
          appColor="tertiary"
          #overlayTrigger="overlayTrigger"
          [overlayTrigger]="listVariablesTmpl"
        >
          <gsf-icon-svg [icon]="ICON_MAGIC_PEN" /> Variable
        </button>

        <div class="flex items-center">
          <button gsfButton appColor="tertiary" class="text-text-primary-2">
            <gsf-icon-svg [icon]="ICON_UNDO" />
          </button>
          <button gsfButton appColor="tertiary" class="text-text-primary-2">
            <gsf-icon-svg [icon]="ICON_REDO" />
          </button>
        </div>
      </div>

      <ng-container [ngTemplateOutlet]="sepratorTmpl" />

      <button gsfButton appColor="tertiary" class="text-text-primary-2">
        <gsf-icon-svg [icon]="ICON_ARROW_RIGHT_DOUBLE" />
      </button>
    </div>

    <ng-template #sepratorTmpl>
      <div class="w-[1px] h-10 bg-stroke-primary-2"></div>
    </ng-template>

    <app-wrap-overlay #listVariablesTmpl>
      <div
        class="max-w-[296px] min-w-[296px] bg-white border border-stroke-primary-2 shadow-md rounded-lg p-[6px]"
      >
        <div class="flex flex-col gap-1">
          @for (variable of variables; track $index) {
            <div
              class="flex gap-3 items-center cursor-pointer py-2 px-[10px] hover:bg-fill-cta-others-hover"
              (click)="selectVariable(variable)"
            >
              <gsf-icon-svg [icon]="variable.icon" />
              <span class="text-text-primary-2"> {{ variable.label }}</span>
            </div>
          }
        </div>
      </div>
    </app-wrap-overlay>
  `,
  imports: [
    NgTemplateOutlet,
    IconSvgComponent,
    ButtonDirective,
    OverlayTriggerDirective,
    WrapOverlayComponent
  ]
})
export class TemplateEditorHeaderComponent {
  private canvasService = inject(CanvasFacadeService);

  @ViewChild('overlayTrigger') overlayTrigger!: OverlayTriggerDirective;

  ICON_MAGIC_PEN = ICON_MAGIC_PEN;
  ICON_UNDO = ICON_UNDO;
  ICON_REDO = ICON_REDO;
  ICON_ARROW_LEFT_DOUBLE = ICON_ARROW_LEFT_DOUBLE;
  ICON_ARROW_RIGHT_DOUBLE = ICON_DOUBLE_ARROW_RIGHT;

  variables = variables;


  private readonly actionMap: Partial<Record<VariableType, () => void>> = {
    text: () => this.canvasService.addText(),
    image: () => this.canvasService.addImage(DEFAULT_IMAGE_URL),
    button: () => this.canvasService.addButton()
  };

  selectVariable(variable: Variable) {
    this.actionMap[variable.type]?.();
    this.overlayTrigger.closeOverlay();
  }
}
