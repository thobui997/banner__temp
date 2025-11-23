import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CanvasFacadeService } from '../../services/canvas/canvas-facade.service';
import { Layer } from '../../types/layer.type';
import { VariableType } from '../../types/variable.type';

/**
 * Layers Panel Component
 *
 * Component hiển thị và quản lý layers của canvas.
 * Features:
 * - Danh sách layers với preview
 * - Drag & Drop để reorder layers (Angular CDK)
 * - Toggle visibility (show/hide)
 * - Delete layer
 * - Select layer để activate object trên canvas
 * - Highlight selected layer
 * - Frame luôn ở bottom, không thể move hoặc delete
 *
 * Angular Best Practices:
 * - Standalone component
 * - Reactive with Observables
 * - OnPush change detection strategy (optional)
 * - Unsubscribe on destroy
 * - Dependency Injection
 */
@Component({
  selector: 'app-layers-panel',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <div class="layers-panel">
      <!-- Header -->
      <div class="panel-header">
        <h3 class="panel-title">Layers</h3>
        <span class="layer-count">{{ (layers$ | async)?.length || 0 }}</span>
      </div>

      <!-- Layers List with CDK Drag & Drop -->
      <div
        cdkDropList
        class="layers-list"
        (cdkDropListDropped)="onLayerDrop($event)"
        [cdkDropListDisabled]="false"
      >
        <div
          *ngFor="let layer of layers$ | async; trackBy: trackByLayerId"
          class="layer-item"
          [class.layer-selected]="layer.id === selectedLayerId"
          [class.layer-frame]="layer.type === 'frame'"
          [class.layer-hidden]="!layer.visible"
          cdkDrag
          [cdkDragDisabled]="layer.type === 'frame'"
          (click)="onSelectLayer(layer.id)"
          (mouseenter)="onLayerHover(layer.id)"
          (mouseleave)="onLayerHover(null)"
        >
          <!-- Drag Handle -->
          <div class="drag-handle" *ngIf="layer.type !== 'frame'">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="6" cy="4" r="1.5"/>
              <circle cx="10" cy="4" r="1.5"/>
              <circle cx="6" cy="8" r="1.5"/>
              <circle cx="10" cy="8" r="1.5"/>
              <circle cx="6" cy="12" r="1.5"/>
              <circle cx="10" cy="12" r="1.5"/>
            </svg>
          </div>

          <!-- Layer Icon -->
          <div class="layer-icon" [attr.data-type]="layer.type">
            {{ getLayerIcon(layer.type) }}
          </div>

          <!-- Layer Info -->
          <div class="layer-info">
            <span class="layer-name">{{ layer.name }}</span>
            <span class="layer-type">{{ getLayerTypeLabel(layer.type) }}</span>
          </div>

          <!-- Layer Actions -->
          <div class="layer-actions" (click)="$event.stopPropagation()">
            <!-- Visibility Toggle -->
            <button
              class="action-button"
              [class.action-active]="layer.visible"
              (click)="onToggleVisibility(layer.id)"
              [title]="layer.visible ? 'Hide layer' : 'Show layer'"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path *ngIf="layer.visible" d="M8 3C4.5 3 1.7 5.3 1 8c.7 2.7 3.5 5 7 5s6.3-2.3 7-5c-.7-2.7-3.5-5-7-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
                <path *ngIf="!layer.visible" d="M8 3C4.5 3 1.7 5.3 1 8c.2.7.5 1.3.9 1.9L1 10.8l.7.7 13-13L14 7.2l-.9.9C12.5 7.5 11.8 7 11 7c-.5-.3-1-.5-1.5-.6L8 3zM3.3 8.7L2.2 9.8C1.8 9.2 1.5 8.6 1.3 8c.7-2.4 3.2-4.2 6-4.8L8.7 4.6C7.8 4.2 6.9 4 6 4c-2.2 0-4 1.8-4 4 0 .3 0 .5.3.7z"/>
              </svg>
            </button>

            <!-- Delete Button (not for frame) -->
            <button
              *ngIf="canDeleteLayer(layer)"
              class="action-button action-delete"
              (click)="onDeleteLayer(layer.id)"
              title="Delete layer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 2h4v1H6V2zm6 1h2v1H2V3h2V2h8v1zM3 5h10v9H3V5zm2 2v5h2V7H5zm4 0v5h2V7H9z"/>
              </svg>
            </button>
          </div>

          <!-- CDK Drag Preview (optional custom preview) -->
          <div *cdkDragPreview class="layer-drag-preview">
            <div class="layer-icon" [attr.data-type]="layer.type">
              {{ getLayerIcon(layer.type) }}
            </div>
            <span class="layer-name">{{ layer.name }}</span>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="(layers$ | async)?.length === 0" class="empty-state">
          <p>No layers yet</p>
          <small>Add objects to see them here</small>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .layers-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: white;
        border-left: 1px solid #e5e7eb;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .panel-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }

      .layer-count {
        font-size: 13px;
        color: #6b7280;
        padding: 2px 8px;
        background: #f3f4f6;
        border-radius: 12px;
      }

      .layers-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }

      .layer-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        margin-bottom: 4px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        user-select: none;
      }

      .layer-item:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      .layer-selected {
        background: #ede9fe !important;
        border-color: #764FDB !important;
      }

      .layer-frame {
        opacity: 0.7;
        cursor: default !important;
      }

      .layer-hidden {
        opacity: 0.5;
      }

      /* CDK Drag & Drop */
      .cdk-drag-preview {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        opacity: 0.8;
      }

      .cdk-drag-placeholder {
        opacity: 0.4;
        background: #e5e7eb;
      }

      .cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .layers-list.cdk-drop-list-dragging .layer-item:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .drag-handle {
        display: flex;
        align-items: center;
        color: #9ca3af;
        cursor: grab;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .layer-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: #f3f4f6;
        border-radius: 4px;
        font-size: 16px;
      }

      .layer-icon[data-type="text"] {
        background: #dbeafe;
        color: #1e40af;
      }

      .layer-icon[data-type="image"] {
        background: #dcfce7;
        color: #15803d;
      }

      .layer-icon[data-type="button"] {
        background: #fce7f3;
        color: #be185d;
      }

      .layer-icon[data-type="frame"] {
        background: #e5e7eb;
        color: #6b7280;
      }

      .layer-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .layer-name {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .layer-type {
        font-size: 12px;
        color: #9ca3af;
        text-transform: capitalize;
      }

      .layer-actions {
        display: flex;
        gap: 4px;
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 4px;
        color: #9ca3af;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-button:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .action-button.action-active {
        color: #764FDB;
      }

      .action-button.action-delete:hover {
        background: #fee2e2;
        color: #dc2626;
      }

      .layer-drag-preview {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: white;
        border: 1px solid #764FDB;
        border-radius: 6px;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        color: #9ca3af;
      }

      .empty-state p {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 500;
      }

      .empty-state small {
        font-size: 12px;
      }
    `
  ]
})
export class LayersPanelComponent implements OnInit, OnDestroy {
  private canvasService = inject(CanvasFacadeService);
  private destroy$ = new Subject<void>();

  // Observables
  layers$!: Observable<Layer[]>;

  // Selected layer ID
  selectedLayerId: string | null = null;

  ngOnInit(): void {
    // Subscribe to layers
    this.layers$ = this.canvasService.layers$;

    // Track selected object để highlight layer
    this.canvasService.selectedObject$
      .pipe(takeUntil(this.destroy$))
      .subscribe((obj) => {
        if (obj) {
          const metadata = obj.get('customMetadata') as any;
          this.selectedLayerId = metadata?.id || null;
        } else {
          this.selectedLayerId = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle layer drop (CDK Drag & Drop)
   * Reorder layers khi user drag & drop
   */
  onLayerDrop(event: CdkDragDrop<Layer[]>): void {
    // Get previous and current index
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    // Don't reorder if dropped in same position
    if (previousIndex === currentIndex) return;

    // Call canvas service to reorder layers
    this.canvasService.reorderLayers(previousIndex, currentIndex);
  }

  /**
   * Select layer và activate object trên canvas
   */
  onSelectLayer(layerId: string): void {
    this.canvasService.selectLayer(layerId);
  }

  /**
   * Toggle layer visibility
   */
  onToggleVisibility(layerId: string): void {
    this.canvasService.toggleLayerVisibility(layerId);
  }

  /**
   * Delete layer
   */
  onDeleteLayer(layerId: string): void {
    if (confirm('Are you sure you want to delete this layer?')) {
      this.canvasService.deleteLayer(layerId);
    }
  }

  /**
   * Layer hover effect (highlight object on canvas)
   */
  onLayerHover(layerId: string | null): void {
    // Optional: Implement hover effect on canvas
    // You can add this method to LayerManagementService if needed
  }

  /**
   * Check if layer can be deleted
   * Frame cannot be deleted
   */
  canDeleteLayer(layer: Layer): boolean {
    return layer.type !== VariableType.FRAME;
  }

  /**
   * Get layer icon based on type
   */
  getLayerIcon(type: string): string {
    const icons: Record<string, string> = {
      text: 'T',
      image: '🖼',
      button: '🔘',
      frame: '▭'
    };
    return icons[type] || '?';
  }

  /**
   * Get layer type label
   */
  getLayerTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      text: 'Text',
      image: 'Image',
      button: 'Button',
      frame: 'Frame'
    };
    return labels[type] || 'Unknown';
  }

  /**
   * TrackBy function for ngFor optimization
   */
  trackByLayerId(index: number, layer: Layer): string {
    return layer.id;
  }
}
