import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { AlignObjectCommand } from '../../commands/align-object.command';
import { TransformObjectCommand } from '../../commands/transform-object.command';
import { AlignmentType, TransformType } from '../../types/canvas-object.type';
import { CanvasEventHandlerService } from '../canvas/canvas-event-handler.service';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { CommandManagerService } from '../command/command-manager.service';
import { TransformObjectService } from '../transforms/transform-object.service';

/**
 * Base service providing common functionality for all property components
 * Handles alignment, transformation, and canvas synchronization
 */
@Injectable()
export class BasePropertiesService {
  protected canvasState = inject(CanvasStateService);
  protected eventHandler = inject(CanvasEventHandlerService);
  protected transformService = inject(TransformObjectService);
  protected destroyRef = inject(DestroyRef);
  protected commandManager = inject(CommandManagerService);

  /**
   * Handles object alignment within canvas or frame
   */
  handleAlign(type: AlignmentType): void {
    const canvas = this.canvasState.getCanvas();
    const obj = canvas.getActiveObject();
    if (!obj) return;

    const frame = this.canvasState.getFrameBounds();
    const canvasSize = this.canvasState.getCanvasDimensions();

    const newPos = frame
      ? this.transformService.alignObjectToFrame(obj, type, frame)
      : this.transformService.alignObject(obj, type, canvasSize.width, canvasSize.height);

    const command = new AlignObjectCommand(canvas, obj, newPos.left, newPos.top, () =>
      this.eventHandler.emitCurrentObjectProperties()
    );

    this.commandManager.execute(command);
  }

  /**
   * Handles object transformation (rotation, flip, etc.)
   */
  handleTransform(type: TransformType): void {
    const canvas = this.canvasState.getCanvas();
    const obj = canvas.getActiveObject();
    if (!obj) return;

    const newProps = this.transformService.transformObject(obj, type);

    const command = new TransformObjectCommand(canvas, obj, newProps, () =>
      this.eventHandler.emitCurrentObjectProperties()
    );

    this.commandManager.execute(command);
  }

  /**
   * Subscribe to canvas changes and update form accordingly
   * @param form FormGroup to update
   * @param objectType Type of object to filter
   * @param mapToForm Function to map canvas properties to form values
   * @param onPropertiesReceived Optional callback when properties are received
   */
  subscribeToCanvasChanges<TCanvas, TForm>(
    form: FormGroup,
    objectType: string,
    mapToForm: (props: TCanvas) => TForm,
    onPropertiesReceived?: (props: TCanvas) => void
  ): void {
    this.canvasState.selectedObjectProperties$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((props) => {
        if (!props || props.type !== objectType) return;

        const formValues = mapToForm(props as TCanvas);

        // Patch form without emitting to prevent circular updates
        Object.keys(formValues as object).forEach((key) => {
          const control = form.get(key);
          if (control) {
            control.setValue((formValues as any)[key], { emitEvent: false });
          }
        });

        // Execute custom callback if provided
        onPropertiesReceived?.(props as TCanvas);
      });
  }
}
