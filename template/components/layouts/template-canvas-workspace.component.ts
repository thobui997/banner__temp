import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';

@Component({
  selector: 'app-template-canvas-workspace',
  standalone: true,
  template: `
    <div class="h-full" #canvasContainerElement>
      <canvas #canvasElement></canvas>
    </div>
  `,
  styles: [
    `
      :host {
        flex: 1;
      }
    `
  ]
})
export class TemplateCanvasWorkspaceComponent implements AfterViewInit, OnDestroy {
  private canvasService = inject(CanvasFacadeService);

  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainerElement') canvasContainerElement!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.canvasService.initCanvas(
      this.canvasElement.nativeElement,
      this.canvasContainerElement.nativeElement.clientWidth,
      this.canvasContainerElement.nativeElement.clientHeight
    );

    setTimeout(() => {
      this.canvasService.addFrame(300, 600);
    }, 100);
  }

  ngOnDestroy(): void {
    this.canvasService.disposeCanvas();
  }
}
