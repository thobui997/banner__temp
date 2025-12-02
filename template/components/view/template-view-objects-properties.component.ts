import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonDirective, ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent } from '@gsf/ui';
import { CanvasStateService } from '../../services/canvas/canvas-state.service';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';
import { ButtonPropertiesComponent } from '../properties-panel/button-properties.component';
import { FramePropertiesComponent } from '../properties-panel/frame-properties.component';
import { ImagePropertiesComponent } from '../properties-panel/image-properties.component';
import { TextPropertiesComponent } from '../properties-panel/text-properties.component';

@Component({
  selector: 'app-template-view-objects-properties-panel',
  standalone: true,
  template: `
    <div class="w-[320px] h-full bg-white border border-stroke-primary-2">
      @if (properties$ | async; as properties) {
        @switch (properties.type) {
          @case ('text') {
            <app-text-properties [isViewOnly]="true" />
          }
          @case ('image') {
            <app-image-properties [isViewOnly]="true" />
          }
          @case ('button') {
            <app-button-properties [isViewOnly]="true" />
          }
          @case ('frame') {
            <app-frame-properties [isViewOnly]="true" />
          }
        }
      } @else {
        <div class="flex items-center px-6 py-3">
          <button gsfButton appColor="tertiary" class="text-text-primary-2" (click)="closePanel()">
            <gsf-icon-svg [icon]="ICON_DOUBLE_ARROW_RIGHT" />
          </button>
        </div>
        <div class="p-4 text-text-primary-2 text-sm">Select an object to view properties</div>
      }
    </div>
  `,
  imports: [
    CommonModule,
    TextPropertiesComponent,
    ImagePropertiesComponent,
    ButtonPropertiesComponent,
    FramePropertiesComponent,
    ButtonDirective,
    IconSvgComponent
  ]
})
export class TemplateViewObjectsPropertiesPanelComponent {
  private canvasStateService = inject(CanvasStateService);
  private panelToggleService = inject(PanelToggleService);

  properties$ = this.canvasStateService.selectedObjectProperties$;

  ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  closePanel(): void {
    this.panelToggleService.closeRightPanel();
  }
}
