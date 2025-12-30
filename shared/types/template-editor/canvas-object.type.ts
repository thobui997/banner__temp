import { Option } from '@gsf/ui';
import { VariableType } from './variable.type';
import { FileStorage } from '@gsf/admin/app/shared/types';

export type TextAlignment = 'left' | 'center' | 'right';
export type ButtonShape = 'rectangle' | 'rounded' | 'pill';
export type ButtonStyle = 'fill' | 'outline' | 'text';
export type AlignmentType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom';
export type TransformType = 'rotate' | 'flip-h' | 'flip-v';

export interface CustomObjectData {
  colorPreset?: Set<string>;
  bgColorPreset?: Set<string>;
  layerId?: string;
  selectionStyles?: any;
  metadata?: {
    id?: string;
    author?: string;
    createdAt?: number;
    tags?: string[];
    type?: VariableType;
  };
}

export interface BaseProperties {
  type: string;
  position?: Position;
  customData?: CustomObjectData;
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Position {
  x: number;
  y: number;
  angle: number;
}

export interface TextPropertiesFormValues {
  type: 'text';
  position: Position;
  textColor: string;
  fontFamily: Option<string>[];
  fontWeight: Option<number>[];
  fontSize: Option<number>[];
  textAlignment: TextAlignment;
  text: string;
}

export interface TextProperties extends BaseProperties {
  type: 'text';
  position: Position;
  textColor: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  textAlignment: TextAlignment;
  text: string;
  width?: number;
}

export interface ImageProperties extends BaseProperties {
  type: 'image';
  position: Position;
  width: number;
  height: number;
  cornerRadius: number;
  opacity: number;
  src?: string;
  attachments?: FileStorage[];
}

export interface ButtonProperties extends BaseProperties {
  type: 'button';
  position: Position;
  width: number;
  height: number;
  shape: ButtonShape;
  style: ButtonStyle;
  buttonColor: string;
  textColor: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  textAlignment: TextAlignment;
  text: string;
  buttonLink?: string;
}

export interface ButtonPropertiesFormValues {
  type: 'button';
  position: Position;
  width: number;
  height: number;
  textColor: string;
  fontFamily: Option<string>[];
  fontWeight: Option<number>[];
  fontSize: Option<number>[];
  textAlignment: TextAlignment;
  text: string;
  shape: ButtonShape;
  buttonStyle: ButtonStyle;
  buttonColor: string;
  buttonLink?: string;
}

export interface FrameProperties extends BaseProperties {
  type: 'frame';
  bgColor: string;
}

export type CanvasObjectProperties =
  | TextProperties
  | ImageProperties
  | ButtonProperties
  | FrameProperties;
