import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ButtonDirective,
  ICON_16x9,
  ICON_1x2,
  ICON_ARROW_LEFT_DOUBLE,
  ICON_DOUBLE_ARROW_RIGHT,
  IconSvgComponent
} from '@gsf/ui';
import { Observable } from 'rxjs';
import { RatioEnum } from '../../enums/ratio.enum';
import { FrameRatioService } from '../../services/frame/frame-ratio.service';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';

@Component({
  selector: 'app-template-view-header',
  standalone: true,
  template: `
    <div class="flex gap-4 items-center bg-white py-3 px-4 border-b border-stroke-primary-2">
      <!-- Open Left Panel Button -->
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

      <!-- Ratio Display (Read-only) -->
      <div class="flex items-center gap-1">
        <button
          [class]="getRatioButtonClass(RatioEnum.Ratio1x2)"
          disabled
          title="Template ratio: 1:2"
        >
          <gsf-icon-svg [icon]="ICON_1x2" />
        </button>
        <button
          [class]="getRatioButtonClass(RatioEnum.Ratio16x9)"
          disabled
          title="Template ratio: 16:9"
        >
          <gsf-icon-svg [icon]="ICON_16x9" />
        </button>
      </div>

      <ng-container [ngTemplateOutlet]="sepratorTmpl" />

      <div class="flex-1 flex items-center justify-between">
        <div class="text-sm text-text-secondary font-medium">View Only Mode</div>
      </div>

      <!-- Open Right Panel Button -->
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
  `,
  imports: [CommonModule, NgTemplateOutlet, IconSvgComponent, ButtonDirective]
})
export class TemplateViewHeaderComponent {
  private panelToggleService = inject(PanelToggleService);
  private ratioService = inject(FrameRatioService);

  ICON_ARROW_LEFT_DOUBLE = ICON_ARROW_LEFT_DOUBLE;
  ICON_ARROW_RIGHT_DOUBLE = ICON_DOUBLE_ARROW_RIGHT;
  ICON_16x9 = ICON_16x9;
  ICON_1x2 = ICON_1x2;

  RatioEnum = RatioEnum;

  panelState$ = this.panelToggleService.state$;
  currentRatio$: Observable<number> = this.ratioService.currentRatio$;

  openLeftPanel(): void {
    this.panelToggleService.openLeftPanel();
  }

  openRightPanel(): void {
    this.panelToggleService.openRightPanel();
  }

  getRatioButtonClass(ratio: number): string {
    const baseClass =
      'outline-none border-none py-[10px] px-2 rounded-lg w-10 h-10 flex items-center justify-center transition-colors cursor-not-allowed';
    const currentRatio = this.ratioService.getCurrentRatio();

    if (currentRatio === ratio) {
      return `${baseClass} bg-fill-cta-others-hover text-text-primary-1 opacity-60`;
    }

    return `${baseClass} bg-fill-surface-bg-default text-text-tertiary opacity-60`;
  }
}
