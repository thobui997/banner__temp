import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { ZoomControlsComponent } from '@gsf/admin/app/shared/components';
import { CanvasFacadeService } from '@gsf/admin/app/shared/services';

@Component({
  selector: 'app-template-canvas-workspace',
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
export class TemplateCanvasWorkspaceComponent implements AfterViewInit, OnDestroy {
  private canvasService = inject(CanvasFacadeService);

  @Input() isLoading = false;
  @Input() skipFrameCreation = false;
  @Output() canvasReady = new EventEmitter<void>();

  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainerElement') canvasContainerElement!: ElementRef<HTMLElement>;

  private resizeObserver?: ResizeObserver;
  private resizeTimeout?: any;

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

    setTimeout(() => {
      this.canvasReady.emit();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeObserver?.disconnect();
    this.canvasService.disposeCanvas();
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      // Clear previous timeout
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      // Debounce resize to avoid too many calls
      this.resizeTimeout = setTimeout(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;

          // Use requestAnimationFrame for smooth resize
          requestAnimationFrame(() => {
            this.canvasService.resizeCanvas(width, height);
          });
        }
      }, 50);
    });

    this.resizeObserver.observe(this.canvasContainerElement.nativeElement);
  }
}
