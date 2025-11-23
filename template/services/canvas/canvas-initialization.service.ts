import { inject, Injectable } from '@angular/core';
import { Canvas } from 'fabric';
import { CanvasStateService } from './canvas-state.service';
import { CanvasEventHandlerService } from './canvas-event-handler.service';

@Injectable()
export class CanvasInitializationService {
  private canvasStateService = inject(CanvasStateService);
  private eventHandlerService = inject(CanvasEventHandlerService);

  initCanvas(element: HTMLCanvasElement, width: number, height: number): Canvas {
    const canvas = new Canvas(element, {
      width,
      height,
      preserveObjectStacking: true
    });

    this.canvasStateService.setCanvas(canvas);
    this.eventHandlerService.setupEventListeners(canvas);

    return canvas;
  }

  disposeCanvas(): void {
    const canvas = this.canvasStateService.getCanvas();
    if (canvas) {
      canvas.dispose();
    }
  }
}
