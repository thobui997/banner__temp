import { Component } from '@angular/core';
import { TemplateEditorHeaderComponent } from './template-editor-header.component';
import { TemplatePropertiesPanelComponent } from './template-properties-panel.component';
import { TemplateObjectsPropertiesPanelComponent } from './template-objects-properties-panel.component';
import { TemplateCanvasWorkspaceComponent } from './template-canvas-workspace.component';

@Component({
  selector: 'app-template-editor-container',
  standalone: true,
  imports: [
    TemplateEditorHeaderComponent,
    TemplatePropertiesPanelComponent,
    TemplateObjectsPropertiesPanelComponent,
    TemplateCanvasWorkspaceComponent
  ],
  template: `
    <div class="flex h-full overflow-hidden">
      <!-- Left Sidebar: Template Properties panel -->
      <app-template-properties-panel />

      <!-- main content -->
      <div class="flex-1 flex flex-col">
        <app-template-editor-header />

        <!-- Canvas Workspace -->
        <app-template-canvas-workspace />
      </div>

      <!-- Right Sidebar: Objects Properties -->
      <app-template-objects-properties-panel />
    </div>
  `,
  styles: [
    `
      :host {
        height: calc(100dvh - 64px - 48px - 32px - 24px);
      }
    `
  ]
})
export class TemplateEditorContainerComponent {}
