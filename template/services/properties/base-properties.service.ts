import { DestroyRef, inject, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { ObjectCreationService } from '../objects/object-creation.service';
import { AlignmentType, TransformType } from '../../types/canvas-object.type';
import { CanvasEventHandlerService } from '../canvas/canvas-event-handler.service';
import { TransformObjectService } from '../transforms/transform-object.service';

/**
 * Base service providing common functionality for all property components
 * Handles alignment, transformation, and canvas synchronization
 */
@Injectable()
export class BasePropertiesService {
  protected canvasState = inject(CanvasStateService);
  protected objectCreation = inject(ObjectCreationService);
  protected eventHandler = inject(CanvasEventHandlerService);
  protected transformService = inject(TransformObjectService);
  protected destroyRef = inject(DestroyRef);

  /**
   * Handles object alignment within canvas or frame
   */
  handleAlign(type: AlignmentType): void {
    const canvas = this.canvasState.getCanvas();
    const obj = canvas.getActiveObject();
    if (!obj) return;

    const frame = this.objectCreation.getFrameBounds();
    const canvasSize = this.canvasState.getCanvasDimensions();

    const newPos = frame
      ? this.transformService.alignObjectToFrame(obj, type, frame)
      : this.transformService.alignObject(obj, type, canvasSize.width, canvasSize.height);

    obj.set(newPos);
    obj.setCoords();
    canvas.renderAll();

    this.eventHandler.emitCurrentObjectProperties();
  }

  /**
   * Handles object transformation (rotation, flip, etc.)
   */
  handleTransform(type: TransformType): void {
    const canvas = this.canvasState.getCanvas();
    const obj = canvas.getActiveObject();
    if (!obj) return;

    this.transformService.transformObject(obj, type);
    canvas.renderAll();

    this.eventHandler.emitCurrentObjectProperties();
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
    let syncingFromCanvas = false;

    this.canvasState.selectedObjectProperties$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((props) => {
        if (!props || props.type !== objectType) return;

        syncingFromCanvas = true;
        const formValues = mapToForm(props as TCanvas);

        // Patch form without emitting to prevent circular updates
        Object.keys(formValues as object).forEach((key) => {
          const control = form.get(key);
          if (control) {
            control.setValue((formValues as any)[key], { emitEvent: false });
          }
        });

        syncingFromCanvas = false;

        // Execute custom callback if provided
        onPropertiesReceived?.(props as TCanvas);
      });
  }
}
