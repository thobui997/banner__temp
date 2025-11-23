import { Directive, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BasePropertiesService } from '../../services/properties/base-properties.service';
import { AlignmentType, TransformType } from '../../types/canvas-object.type';

/**
 * Abstract base component for all property panels
 * Provides common functionality and enforces consistent behavior
 */
@Directive()
export abstract class BasePropertiesComponent<TFormService> implements OnInit {
  abstract form: FormGroup;
  protected abstract formService: TFormService;
  protected abstract baseService: BasePropertiesService;

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
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

  /**
   * Handle alignment - delegates to base service
   */
  onAlign(type: AlignmentType): void {
    this.baseService.handleAlign(type);
  }

  /**
   * Handle transformation - delegates to base service
   */
  onTransform(type: TransformType): void {
    this.baseService.handleTransform(type);
  }
}
