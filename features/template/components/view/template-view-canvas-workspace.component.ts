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

  @Input() isLoading = false;
  @Input() skipFrameCreation = false;
  @Output() canvasReady = new EventEmitter<void>();

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

    setTimeout(() => {
      this.canvasReady.emit();
    }, 100);
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
