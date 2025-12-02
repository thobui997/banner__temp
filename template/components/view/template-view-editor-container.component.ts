import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelToggleService } from '../../services/ui/panel-toggle.service';
import { TemplateViewHeaderComponent } from './template-view-header.component';
import { TemplateViewPropertiesPanelComponent } from './template-view-properties-panel.component';
import { TemplateViewCanvasWorkspaceComponent } from './template-view-canvas-workspace.component';
import { TemplateViewObjectsPropertiesPanelComponent } from './template-view-objects-properties.component';

@Component({
  selector: 'app-template-view-editor-container',
  standalone: true,
  imports: [
    CommonModule,
    TemplateViewHeaderComponent,
    TemplateViewPropertiesPanelComponent,
    TemplateViewObjectsPropertiesPanelComponent,
    TemplateViewCanvasWorkspaceComponent
  ],
  template: `
    <div class="flex h-full overflow-hidden">
      <!-- Left Sidebar: Template Properties panel -->
      <div
        class="panel-wrapper left-panel"
        [class.panel-closed]="!(panelState$ | async)?.leftPanelOpen"
      >
        <app-template-view-properties-panel />
      </div>

      <!-- main content -->
      <div class="flex-1 flex flex-col min-w-0">
        <app-template-view-header />

        <!-- Canvas Workspace -->
        <app-template-view-canvas-workspace [skipFrameCreation]="skipFrameCreation" />
      </div>

      <!-- Right Sidebar: Objects Properties -->
      <div
        class="panel-wrapper right-panel"
        [class.panel-closed]="!(panelState$ | async)?.rightPanelOpen"
      >
        <app-template-view-objects-properties-panel />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        height: calc(100dvh - 64px - 48px - 32px - 24px);
      }

      .panel-wrapper {
        flex-shrink: 0;
        transition:
          margin 0.3s ease-in-out,
          opacity 0.3s ease-in-out;
        opacity: 1;
      }

      .left-panel {
        margin-left: 0;
      }

      .left-panel.panel-closed {
        margin-left: -320px;
        opacity: 0;
        pointer-events: none;
      }

      .right-panel {
        margin-right: 0;
      }

      .right-panel.panel-closed {
        margin-right: -320px;
        pointer-events: none;
      }

      .panel-wrapper > * {
        width: 320px;
        flex-shrink: 0;
      }
    `
  ]
})
export class TemplateViewEditorContainerComponent {
  private panelToggleService = inject(PanelToggleService);

  @Input() skipFrameCreation = false;

  panelState$ = this.panelToggleService.state$;
}
