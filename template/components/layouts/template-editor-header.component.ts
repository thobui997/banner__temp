import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { WrapOverlayComponent } from '@gsf/admin/app/shared/components';
import { OverlayTriggerDirective } from '@gsf/admin/app/shared/directives';
import {
  ButtonDirective,
  ICON_16x9,
  ICON_1x2,
  ICON_ARROW_LEFT_DOUBLE,
  ICON_DOUBLE_ARROW_RIGHT,
  ICON_MAGIC_PEN,
  ICON_REDO,
  ICON_UNDO,
  IconSvgComponent
} from '@gsf/ui';
import { Observable } from 'rxjs';
import { DEFAULT_IMAGE_URL, variables } from '../../consts/variables.const';
import { RatioEnum } from '../../enums/ratio.enum';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { CommandManagerService } from '../../services/command/command-manager.service';
import { FrameRatioService } from '../../services/frame/frame-ratio.service';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';
import { Variable, VariableType } from '../../types/variable.type';

@Component({
  selector: 'app-template-editor-header',
  standalone: true,
  template: `
    <div class="flex gap-4 items-center bg-white py-3 px-4 border-b border-stroke-primary-2">
      <!-- Open Left Panel Button - Only show when panel is closed -->
      @if ((panelState$ | async)?.leftPanelOpen === false) {
        <button
          gsfButton
          appColor="tertiary"
          class="text-text-primary-2"
          (click)="openLeftPanel()"
          title="Open left panel"
        >
          <gsf-icon-svg [icon]="ICON_ARROW_RIGHT_DOUBLE" />
        </button>

        <ng-container [ngTemplateOutlet]="sepratorTmpl" />
      }

      <!-- Ratio Switcher -->
      <div class="flex items-center gap-1">
        <button
          [class]="getRatioButtonClass(RatioEnum.Ratio1x2)"
          (click)="changeRatio(RatioEnum.Ratio1x2)"
          title="Switch to 1:2 ratio"
        >
          <gsf-icon-svg [icon]="ICON_1x2" />
        </button>
        <button
          [class]="getRatioButtonClass(RatioEnum.Ratio16x9)"
          (click)="changeRatio(RatioEnum.Ratio16x9)"
          title="Switch to 16:9 ratio"
        >
          <gsf-icon-svg [icon]="ICON_16x9" />
        </button>
      </div>

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
          <button
            gsfButton
            appColor="tertiary"
            class="text-text-primary-2"
            [disabled]="(canUndo$ | async) === false"
            (click)="onUndo()"
            title="Undo (Ctrl+Z)"
          >
            <gsf-icon-svg [icon]="ICON_UNDO" />
          </button>
          <button
            gsfButton
            appColor="tertiary"
            class="text-text-primary-2"
            [disabled]="(canRedo$ | async) === false"
            (click)="onRedo()"
            title="Redo (Ctrl+Y)"
          >
            <gsf-icon-svg [icon]="ICON_REDO" />
          </button>
        </div>
      </div>

      <!-- Open Right Panel Button - Only show when panel is closed -->
      @if ((panelState$ | async)?.rightPanelOpen === false) {
        <ng-container [ngTemplateOutlet]="sepratorTmpl" />

        <button
          gsfButton
          appColor="tertiary"
          class="text-text-primary-2"
          (click)="openRightPanel()"
          title="Open right panel"
        >
          <gsf-icon-svg [icon]="ICON_ARROW_LEFT_DOUBLE" />
        </button>
      }
    </div>

    <ng-template #sepratorTmpl>
      <div class="w-[1px] h-10 bg-stroke-primary-2"></div>
    </ng-template>

    <app-wrap-overlay #listVariablesTmpl>
      <div
        class="max-w-[296px] min-w-[296px] bg-white border border-stroke-primary-2 shadow-md rounded-lg p-[6px] "
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
    CommonModule,
    NgTemplateOutlet,
    IconSvgComponent,
    ButtonDirective,
    OverlayTriggerDirective,
    WrapOverlayComponent
  ]
})
export class TemplateEditorHeaderComponent implements OnInit {
  private canvasService = inject(CanvasFacadeService);
  private commandManager = inject(CommandManagerService);
  private panelToggleService = inject(PanelToggleService);
  private ratioService = inject(FrameRatioService);

  @ViewChild('overlayTrigger') overlayTrigger!: OverlayTriggerDirective;

  ICON_MAGIC_PEN = ICON_MAGIC_PEN;
  ICON_UNDO = ICON_UNDO;
  ICON_REDO = ICON_REDO;
  ICON_ARROW_LEFT_DOUBLE = ICON_ARROW_LEFT_DOUBLE;
  ICON_ARROW_RIGHT_DOUBLE = ICON_DOUBLE_ARROW_RIGHT;
  ICON_16x9 = ICON_16x9;
  ICON_1x2 = ICON_1x2;

  // Expose RatioEnum to template
  RatioEnum = RatioEnum;

  variables = variables;

  canUndo$!: Observable<boolean>;
  canRedo$!: Observable<boolean>;
  panelState$ = this.panelToggleService.state$;
  currentRatio$ = this.ratioService.currentRatio$;

  ngOnInit(): void {
    this.canUndo$ = this.commandManager.canUndo$;
    this.canRedo$ = this.commandManager.canRedo$;
  }

  private readonly actionMap: Partial<Record<VariableType, () => void>> = {
    text: () => this.canvasService.addText(),
    image: () => this.canvasService.addImage(DEFAULT_IMAGE_URL),
    button: () => this.canvasService.addButton()
  };

  selectVariable(variable: Variable) {
    this.actionMap[variable.type]?.();
    this.overlayTrigger.closeOverlay();
  }

  onUndo(): void {
    this.commandManager.undo();
  }

  onRedo(): void {
    this.commandManager.redo();
  }

  openLeftPanel(): void {
    this.panelToggleService.openLeftPanel();
  }

  openRightPanel(): void {
    this.panelToggleService.openRightPanel();
  }

  /**
   * Change frame ratio
   */
  changeRatio(ratio: number): void {
    this.ratioService.changeRatio(ratio);
  }

  /**
   * Get CSS class for ratio button based on active state
   */
  getRatioButtonClass(ratio: number): string {
    const baseClass =
      'outline-none border-none py-[10px] px-2 rounded-lg w-10 h-10 flex items-center justify-center transition-colors';
    const currentRatio = this.ratioService.getCurrentRatio();

    if (currentRatio === ratio) {
      return `${baseClass} bg-fill-cta-others-hover text-text-primary-1`;
    }

    return `${baseClass} bg-fill-surface-bg-default text-text-tertiary hover:bg-fill-cta-others-hover`;
  }
}
