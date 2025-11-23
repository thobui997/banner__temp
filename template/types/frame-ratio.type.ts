/**
 * Frame aspect ratio type definitions
 * Defines các tỉ lệ khung hình có sẵn và custom
 */

export type FrameRatioType = '1:2' | '16:9' | '4:3' | '9:16' | '1:1' | 'custom';

export interface FrameRatio {
  type: FrameRatioType;
  label: string;
  width: number;
  height: number;
}

export interface FrameDimensions {
  width: number;
  height: number;
}

/**
 * Predefined frame ratios
 * Các tỉ lệ frame được định nghĩa sẵn
 */
export const FRAME_RATIOS: Record<FrameRatioType, FrameRatio> = {
  '1:2': {
    type: '1:2',
    label: '1:2 (Portrait)',
    width: 300,
    height: 600
  },
  '16:9': {
    type: '16:9',
    label: '16:9 (Landscape)',
    width: 800,
    height: 450
  },
  '4:3': {
    type: '4:3',
    label: '4:3 (Standard)',
    width: 600,
    height: 450
  },
  '9:16': {
    type: '9:16',
    label: '9:16 (Mobile)',
    width: 450,
    height: 800
  },
  '1:1': {
    type: '1:1',
    label: '1:1 (Square)',
    width: 500,
    height: 500
  },
  custom: {
    type: 'custom',
    label: 'Custom',
    width: 400,
    height: 400
  }
};
