import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';
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

  @Input() isLoading = false;
  @Input() skipFrameCreation = false;

  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainerElement') canvasContainerElement!: ElementRef<HTMLElement>;

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.canvasService.initCanvas(
      this.canvasElement.nativeElement,
      this.canvasContainerElement.nativeElement.clientWidth,
      this.canvasContainerElement.nativeElement.clientHeight
    );

    if (!this.skipFrameCreation) {
      setTimeout(() => {
        this.canvasService.initializeFrame(300, 600);
      }, 100);
    }

    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.canvasService.disposeCanvas();
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        // Debounce resize to avoid too many calls
        requestAnimationFrame(() => {
          this.canvasService.resizeCanvas(width, height);
        });
      }
    });

    this.resizeObserver.observe(this.canvasContainerElement.nativeElement);
  }
}
