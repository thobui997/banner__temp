import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplateEditorHeaderComponent } from './template-editor-header.component';
import { TemplatePropertiesPanelComponent } from './template-properties-panel.component';
import { TemplateObjectsPropertiesPanelComponent } from './template-objects-properties-panel.component';
import { TemplateCanvasWorkspaceComponent } from './template-canvas-workspace.component';
import { PanelToggleService } from '@gsf/admin/app/shared/services';

@Component({
  selector: 'app-template-editor-container',
  standalone: true,
  imports: [
    CommonModule,
    TemplateEditorHeaderComponent,
    TemplatePropertiesPanelComponent,
    TemplateObjectsPropertiesPanelComponent,
    TemplateCanvasWorkspaceComponent
  ],
  template: `
    <div class="flex h-full overflow-hidden">
      <!-- Left Sidebar: Template Properties panel -->
      <div
        class="panel-wrapper left-panel"
        [class.panel-closed]="!(panelState$ | async)?.leftPanelOpen"
      >
        <app-template-properties-panel />
      </div>

      <!-- main content -->
      <div class="flex-1 flex flex-col min-w-0">
        <app-template-editor-header />

        <!-- Canvas Workspace -->
        <app-template-canvas-workspace [skipFrameCreation]="skipFrameCreation" (canvasReady)="onCanvasReady()" />
      </div>

      <!-- Right Sidebar: Objects Properties -->
      <div
        class="panel-wrapper right-panel"
        [class.panel-closed]="!(panelState$ | async)?.rightPanelOpen"
      >
        <app-template-objects-properties-panel />
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
export class TemplateEditorContainerComponent {
  private panelToggleService = inject(PanelToggleService);

  @Input() skipFrameCreation = false;

  @Output() canvasReady = new EventEmitter<void>();

  panelState$ = this.panelToggleService.state$;

  onCanvasReady(): void {
    this.canvasReady.emit();
  }
}