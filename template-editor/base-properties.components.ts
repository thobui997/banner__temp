import { DestroyRef, Directive, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { FabricObject } from 'fabric';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BasePropertiesService } from '../../services';
import { AlignmentType, TransformType } from '../../types';

/**
 * Abstract base component for all property panels
 * Provides common functionality and enforces consistent behavior
 */
@Directive()
export abstract class BasePropertiesComponent<TFormService> implements OnInit {
  @Input() isViewOnly = false;

  protected destroyRef = inject(DestroyRef);

  abstract form: FormGroup;
  protected abstract formService: TFormService;
  protected abstract baseService: BasePropertiesService;

  protected syncingFromCanvas = false;

  ngOnInit(): void {
    this.initializeForm();

    if (this.isViewOnly) {
      this.form.disable();
    } else {
      this.setupFormSubscriptions();
    }

    this.setupCanvasSubscriptions();
  }

  /**
   * Initialize form - must be implemented by child components
   */
  protected abstract initializeForm(): void;

  /**
   * Setup form value change subscriptions - must be implemented by child components
   */
  protected abstract setupFormSubscriptions(): void;

  /**
   * Setup canvas state subscriptions - must be implemented by child components
   */
  protected abstract setupCanvasSubscriptions(): void;

  protected abstract getActiveObject(): FabricObject | null;

  /**
   * Handle alignment - delegates to base service
   */
  onAlign(type: AlignmentType): void {
    if (this.isViewOnly) return;
    this.baseService.handleAlign(type);
  }

  /**
   * Handle transformation - delegates to base service
   */
  onTransform(type: TransformType): void {
    if (this.isViewOnly) return;
    this.baseService.handleTransform(type);
  }

  protected subscribeToControl<T>(
    controlName: string,
    updateFn: (value: T) => void,
    debounceMs = 300,
    useJsonCompare = false
  ): void {
    const control = this.form.get(controlName);
    if (!control) return;

    let pipe$ = control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef));

    // Apply debounce if specified
    if (debounceMs > 0) {
      pipe$ = pipe$.pipe(debounceTime(debounceMs));
    }

    // Apply distinctUntilChanged with appropriate comparator
    if (useJsonCompare) {
      pipe$ = pipe$.pipe(
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      );
    } else {
      pipe$ = pipe$.pipe(distinctUntilChanged());
    }

    // Subscribe and call update function
    pipe$.subscribe((value) => {
      const obj = this.getActiveObject();
      if (obj && !this.isViewOnly && !this.syncingFromCanvas) {
        updateFn(value);
      }
    });
  }
}
