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
import { ZoomControlsComponent } from '../zoom-controls.component';
import { CanvasStateService } from '../../services/canvas/canvas-state.service';

@Component({
  selector: 'app-template-view-canvas-workspace',
  standalone: true,
  imports: [ZoomControlsComponent],
  template: `
    <div class="h-full relative" #canvasContainerElement>
      <canvas #canvasElement></canvas>
    </div>

    <app-zoom-controls />
  `,
  styles: [
    `
      :host {
        flex: 1;
      }
    `
  ]
})
export class TemplateViewCanvasWorkspaceComponent implements AfterViewInit, OnDestroy {
  private canvasService = inject(CanvasFacadeService);
  private canvasStateService = inject(CanvasStateService);

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

        requestAnimationFrame(() => {
          this.canvasService.resizeCanvas(width, height);
        });
      }
    });

    this.resizeObserver.observe(this.canvasContainerElement.nativeElement);
  }
}
