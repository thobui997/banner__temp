import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ButtonDirective, ICON_ADD_OUTLINE, ICON_OUTLINE_MINUS, IconSvgComponent } from '@gsf/ui';
import { CanvasFacadeService } from '../../services';

@Component({
  selector: 'app-zoom-controls',
  standalone: true,
  imports: [CommonModule, IconSvgComponent, ButtonDirective],
  template: `
    <div class="absolute bottom-6 left-1/2 z-50">
      <div
        class="flex items-center gap-2 bg-white border border-stroke-primary-2 rounded-lg shadow-lg p-2"
      >
        <!-- Zoom Out -->
        <button
          gsfButton
          appColor="tertiary"
          appSize="sm"
          (click)="zoomOut()"
          title="Zoom Out (Ctrl + -)"
          [disabled]="isMinZoom"
        >
          <gsf-icon-svg [icon]="ICON_MINUS" />
        </button>

        <!-- Zoom Percentage Display -->
        <div class="min-w-[60px] text-center flex justify-center">
          <button
            gsfButton
            appColor="tertiary"
            appSize="sm"
            (click)="resetZoom()"
            title="Reset Zoom (Ctrl + 0)"
            class="text-sm font-medium"
          >
            {{ zoomPercentage }}%
          </button>
        </div>

        <!-- Zoom In -->
        <button
          gsfButton
          appColor="tertiary"
          appSize="sm"
          (click)="zoomIn()"
          title="Zoom In (Ctrl + +)"
          [disabled]="isMaxZoom"
        >
          <gsf-icon-svg [icon]="ICON_PLUS" />
        </button>

        <!-- Divider -->
        <div class="w-[1px] h-6 bg-stroke-primary-2 mx-1"></div>

        <!-- Zoom to Fit -->
        <button
          gsfButton
          appColor="tertiary"
          appSize="sm"
          (click)="zoomToFit()"
          title="Zoom to Fit (Ctrl + 1)"
          class="text-sm"
        >
          Fit
        </button>
      </div>

      <!-- Pan Hint (shows when space is pressed) -->
      @if (isPanning) {
        <div
          class="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded text-sm whitespace-nowrap"
        >
          Hold Space + Drag to Pan
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class ZoomControlsComponent implements OnInit {
  private canvasFacade = inject(CanvasFacadeService);

  ICON_PLUS = ICON_ADD_OUTLINE;
  ICON_MINUS = ICON_OUTLINE_MINUS;

  zoomPercentage = 100;
  isMinZoom = false;
  isMaxZoom = false;
  isPanning = false;

  ngOnInit(): void {
    this.canvasFacade.zoomState$.subscribe((state) => {
      this.zoomPercentage = Math.round(state.zoom * 100);
      this.isMinZoom = state.zoom <= state.minZoom;
      this.isMaxZoom = state.zoom >= state.maxZoom;
      this.isPanning = state.isPanning;
    });

    this.setupKeyboardShortcuts();
  }

  zoomIn(): void {
    this.canvasFacade.zoomIn();
  }

  zoomOut(): void {
    this.canvasFacade.zoomOut();
  }

  resetZoom(): void {
    this.canvasFacade.resetZoom();
  }

  zoomToFit(): void {
    this.canvasFacade.zoomToFit();
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Check if Ctrl or Cmd is pressed
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (!isCtrlOrCmd) return;

      switch (event.key) {
        case '+':
        case '=':
          event.preventDefault();
          this.zoomIn();
          break;

        case '-':
        case '_':
          event.preventDefault();
          this.zoomOut();
          break;

        case '0':
          event.preventDefault();
          this.resetZoom();
          break;

        case '1':
          event.preventDefault();
          this.zoomToFit();
          break;
      }
    });
  }
}
