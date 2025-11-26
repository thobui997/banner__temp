import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RatioEnum } from '../../enums/ratio.enum';
import { FrameManagementService } from './frame-management.service';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { UpdateFrameCommand } from '../../commands/update-frame.command';
import { CommandManagerService } from '../command/command-manager.service';

export interface RatioOption {
  value: number;
  label: string;
  width: number;
  height: number;
  aspectRatio: number;
}

@Injectable()
export class FrameRatioService {
  private canvasState = inject(CanvasStateService);
  private frameManagement = inject(FrameManagementService);
  private commandManager = inject(CommandManagerService);

  private currentRatioSubject = new BehaviorSubject<number>(RatioEnum.Ratio1x2);
  readonly currentRatio$: Observable<number> = this.currentRatioSubject.asObservable();

  // Define ratio options with their dimensions
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

    // Store old state
    const oldState = {
      left: frame.left,
      top: frame.top,
      width: frame.width,
      height: frame.height,
      scaleX: frame.scaleX,
      scaleY: frame.scaleY
    };

    // Calculate new dimensions maintaining center position
    const oldWidth = (frame.width || 0) * (frame.scaleX || 1);
    const oldHeight = (frame.height || 0) * (frame.scaleY || 1);
    const oldCenterX = (frame.left || 0) + oldWidth / 2;
    const oldCenterY = (frame.top || 0) + oldHeight / 2;

    const newWidth = newRatioOption.width;
    const newHeight = newRatioOption.height;
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
      this.frameManagement.updateFrameBounds(frame);
      this.frameManagement.applyClippingToAllObjects();
      this.currentRatioSubject.next(newRatioValue);
    });

    this.commandManager.execute(command);

    // Update current ratio
    this.currentRatioSubject.next(newRatioValue);
  }

  /**
   * Initialize ratio from frame dimensions
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

    this.currentRatioSubject.next(closestRatio.value);
  }

  /**
   * Get aspect ratio for current ratio
   */
  getCurrentAspectRatio(): number {
    const ratioOption = this.getRatioOption(this.currentRatioSubject.value);
    return ratioOption?.aspectRatio ?? 1 / 2;
  }
}
