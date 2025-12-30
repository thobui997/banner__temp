import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UpdateFrameCommand } from '../../../commands/template-editor-commands/update-frame.command';
import { RatioEnum } from '../../../enums';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { CommandManagerService } from '../command/command-manager.service';
import { FrameManagementService } from './frame-management.service';

export interface RatioOption {
  value: number;
  label: string;
  width: number;
  height: number;
  aspectRatio: number;
}

interface StoredFrameDimensions {
  width: number;
  height: number;
}

@Injectable()
export class FrameRatioService {
  private canvasState = inject(CanvasStateService);
  private frameManagement = inject(FrameManagementService);
  private commandManager = inject(CommandManagerService);

  private currentRatioSubject = new BehaviorSubject<number>(RatioEnum.Ratio1x2);
  readonly currentRatio$: Observable<number> = this.currentRatioSubject.asObservable();

  // Store original dimensions for each ratio
  private storedDimensions = new Map<number, StoredFrameDimensions>();

  // Define ratio options with their DEFAULT dimensions
  readonly ratioOptions: RatioOption[] = [
    {
      value: RatioEnum.Ratio1x2,
      label: '1:2',
      width: 300,
      height: 600,
      aspectRatio: 1 / 2
    },
    {
      value: RatioEnum.Ratio16x9,
      label: '16:9',
      width: 640,
      height: 360,
      aspectRatio: 16 / 9
    }
  ];

  /**
   * Get current ratio
   */
  getCurrentRatio(): number {
    return this.currentRatioSubject.value;
  }

  /**
   * Get ratio option by value
   */
  getRatioOption(ratioValue: number): RatioOption | undefined {
    return this.ratioOptions.find((opt) => opt.value === ratioValue);
  }

  /**
   * Change frame ratio with undo/redo support
   */
  changeRatio(newRatioValue: number): void {
    const frame = this.canvasState.getFrameObject();
    if (!frame) return;

    const canvas = this.canvasState.getCanvas();
    const currentRatio = this.currentRatioSubject.value;

    // Don't change if already at this ratio
    if (currentRatio === newRatioValue) return;

    const newRatioOption = this.getRatioOption(newRatioValue);
    if (!newRatioOption) return;

    // Store current dimensions before changing
    const currentWidth = frame.getScaledWidth();
    const currentHeight = frame.getScaledHeight();

    this.storedDimensions.set(currentRatio, {
      width: currentWidth,
      height: currentHeight
    });

    // Store old state for undo
    const oldState = {
      left: frame.left,
      top: frame.top,
      width: frame.width,
      height: frame.height,
      scaleX: frame.scaleX,
      scaleY: frame.scaleY
    };

    // Calculate new dimensions
    const oldCenterX = (frame.left || 0) + currentWidth / 2;
    const oldCenterY = (frame.top || 0) + currentHeight / 2;

    // Check if we have stored dimensions for the new ratio
    const storedDims = this.storedDimensions.get(newRatioValue);

    let newWidth: number;
    let newHeight: number;

    if (storedDims) {
      // Restore previously saved dimensions for this ratio
      newWidth = storedDims.width;
      newHeight = storedDims.height;
    } else {
      // Use default dimensions from ratio option
      newWidth = newRatioOption.width;
      newHeight = newRatioOption.height;
    }

    const newLeft = oldCenterX - newWidth / 2;
    const newTop = oldCenterY - newHeight / 2;

    // New state
    const newState = {
      left: newLeft,
      top: newTop,
      width: newWidth,
      height: newHeight,
      scaleX: 1,
      scaleY: 1
    };

    // Create command
    const command = new UpdateFrameCommand(canvas, frame, oldState, newState, () => {
      // Update aspect ratio in metadata
      this.frameManagement.updateAspectRatio(frame, newRatioOption.aspectRatio);

      this.frameManagement.updateFrameBounds(frame);
      this.frameManagement.applyClippingToAllObjects();

      this.syncRatioFromFrame();
    });

    this.commandManager.execute(command);

    // Update current ratio
    this.currentRatioSubject.next(newRatioValue);
  }

  /**
   * Initialize ratio from frame dimensions
   * Call this when loading a template
   */
  initializeRatioFromFrame(): void {
    const frame = this.canvasState.getFrameObject();
    if (!frame) return;

    const width = (frame.width || 0) * (frame.scaleX || 1);
    const height = (frame.height || 0) * (frame.scaleY || 1);
    const aspectRatio = width / height;

    // Find closest matching ratio
    const closestRatio = this.ratioOptions.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.aspectRatio - aspectRatio);
      const currDiff = Math.abs(curr.aspectRatio - aspectRatio);
      return currDiff < prevDiff ? curr : prev;
    });

    // Store the ACTUAL dimensions for this ratio
    this.storedDimensions.set(closestRatio.value, {
      width: width,
      height: height
    });

    this.currentRatioSubject.next(closestRatio.value);

    // Store aspect ratio in metadata
    this.frameManagement.updateAspectRatio(frame, closestRatio.aspectRatio);
  }

  /**
   * Clear stored dimensions (useful when creating new template)
   */
  clearStoredDimensions(): void {
    this.storedDimensions.clear();
  }

  /**
   * Get aspect ratio for current ratio
   */
  getCurrentAspectRatio(): number {
    const ratioOption = this.getRatioOption(this.currentRatioSubject.value);
    return ratioOption?.aspectRatio ?? 1 / 2;
  }

  /**
   * Get stored dimensions for a ratio (if exists)
   */
  getStoredDimensions(ratioValue: number): StoredFrameDimensions | null {
    return this.storedDimensions.get(ratioValue) || null;
  }

  private syncRatioFromFrame(): void {
    const frame = this.canvasState.getFrameObject();
    if (!frame) return;

    const width = (frame.width || 0) * (frame.scaleX || 1);
    const height = (frame.height || 0) * (frame.scaleY || 1);
    const aspectRatio = width / height;

    // Find closest matching ratio
    const closestRatio = this.ratioOptions.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.aspectRatio - aspectRatio);
      const currDiff = Math.abs(curr.aspectRatio - aspectRatio);
      return currDiff < prevDiff ? curr : prev;
    });

    this.currentRatioSubject.next(closestRatio.value);
  }
}
