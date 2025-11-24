import { Injectable } from '@angular/core';
import { FabricObject } from 'fabric';
import { AlignmentType, TransformType } from '../../types/canvas-object.type';

@Injectable()
export class TransformObjectService {
  // Align object on canvas (used when no frame exists)
  alignObject(
    obj: FabricObject,
    type: AlignmentType,
    canvasWidth: number,
    canvasHeight: number
  ): { left: number; top: number } {
    const objWidth = (obj.width || 0) * (obj.scaleX || 1);
    const objHeight = (obj.height || 0) * (obj.scaleY || 1);

    let left = obj.left || 0;
    let top = obj.top || 0;

    switch (type) {
      case 'left':
        left = 0;
        break;
      case 'center-h':
        left = (canvasWidth - objWidth) / 2;
        break;
      case 'right':
        left = canvasWidth - objWidth;
        break;
      case 'top':
        top = 0;
        break;
      case 'center-v':
        top = (canvasHeight - objHeight) / 2;
        break;
      case 'bottom':
        top = canvasHeight - objHeight;
        break;
    }

    return { left, top };
  }

  // Align object to frame boundaries
  alignObjectToFrame(
    obj: FabricObject,
    type: AlignmentType,
    frameBounds: { left: number; top: number; width: number; height: number }
  ): { left: number; top: number } {
    const objWidth = (obj.width || 0) * (obj.scaleX || 1);
    const objHeight = (obj.height || 0) * (obj.scaleY || 1);

    // Frame boundaries
    const frameLeft = frameBounds.left;
    const frameTop = frameBounds.top;
    const frameRight = frameLeft + frameBounds.width;
    const frameBottom = frameTop + frameBounds.height;
    const frameCenterX = frameLeft + frameBounds.width / 2;
    const frameCenterY = frameTop + frameBounds.height / 2;

    let left = obj.left || 0;
    let top = obj.top || 0;

    switch (type) {
      case 'left':
        left = frameLeft;
        break;
      case 'center-h':
        left = frameCenterX - objWidth / 2;
        break;
      case 'right':
        left = frameRight - objWidth;
        break;
      case 'top':
        top = frameTop;
        break;
      case 'center-v':
        top = frameCenterY - objHeight / 2;
        break;
      case 'bottom':
        top = frameBottom - objHeight;
        break;
    }

    return { left, top };
  }

  // Transform object (rotate, flip) with constraint checking
  transformObject(
    obj: FabricObject,
    type: TransformType
  ): { angle?: number; flipX?: boolean; flipY?: boolean } {
    const currentAngle = obj.angle ?? 0;
    const currentFlipX = obj.flipX ?? false;
    const currentFlipY = obj.flipY ?? false;

    switch (type) {
      case 'rotate':
        return {
          angle: (currentAngle + 90) % 360
        };

      case 'flip-h':
        return {
          flipX: !currentFlipX
        };

      case 'flip-v':
        return {
          flipY: !currentFlipY
        };

      default:
        return {};
    }
  }

  // Calculate object position (considering origin point)
  getObjectPosition(obj: FabricObject): { x: number; y: number; angle: number } {
    return {
      x: Math.round(obj.left || 0),
      y: Math.round(obj.top || 0),
      angle: Math.round(obj.angle || 0)
    };
  }

  // Set object position with constraint checking
  setObjectPosition(obj: FabricObject, x: number, y: number, angle?: number): void {
    obj.set({
      left: x,
      top: y,
      ...(angle !== undefined && { angle })
    });

    obj.setCoords();
  }
}
