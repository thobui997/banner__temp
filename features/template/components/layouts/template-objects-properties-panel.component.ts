import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ImagePropertiesComponent } from '../properties-panel/image-properties.component';
import { TextPropertiesComponent } from '../properties-panel/text-properties.component';
import { ButtonPropertiesComponent } from '../properties-panel/button-properties.component';
import { FramePropertiesComponent } from '../properties-panel/frame-properties.component';
import { ButtonDirective, ICON_DOUBLE_ARROW_RIGHT, IconSvgComponent } from '@gsf/ui';
import { CanvasStateService, PanelToggleService } from '@gsf/admin/app/shared/services';

@Component({
  selector: 'app-template-objects-properties-panel',
  standalone: true,
  template: `
    <div class="w-[320px] h-full bg-white border border-stroke-primary-2">
      @if (properties$ | async; as properties) {
        @switch (properties.type) {
          @case ('text') {
            <app-text-properties />
          }
          @case ('image') {
            <app-image-properties />
          }
          @case ('button') {
            <app-button-properties />
          }
          @case ('frame') {
            <app-frame-properties />
          }
        }
      } @else {
        <div class="flex items-center px-6 py-3">
          <button gsfButton appColor="tertiary" class="text-text-primary-2" (click)="closePanel()">
            <gsf-icon-svg [icon]="ICON_DOUBLE_ARROW_RIGHT" />
          </button>
        </div>
        <div class="p-4 text-text-primary-2 text-sm">Select an object to edit properties</div>
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
export class TemplateObjectsPropertiesPanelComponent {
  private canvasStateService = inject(CanvasStateService);
  private panelToggleService = inject(PanelToggleService);

  properties$ = this.canvasStateService.selectedObjectProperties$;

  ICON_DOUBLE_ARROW_RIGHT = ICON_DOUBLE_ARROW_RIGHT;

  closePanel(): void {
    this.panelToggleService.closeRightPanel();
  }
}
