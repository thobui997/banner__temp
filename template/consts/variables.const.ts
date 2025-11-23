import { ICON_ADD_BOLD, ICON_IMAGE, ICON_TEXT } from '@gsf/ui';
import { Variable } from '../types/variable.type';

export const variables: Variable[] = [
  {
    label: 'Text',
    icon: ICON_TEXT,
    type: 'text'
  },
  {
    label: 'Image',
    icon: ICON_IMAGE,
    type: 'image'
  },
  {
    label: 'Button',
    icon: ICON_ADD_BOLD,
    type: 'button'
  }
];

export const VariableType = {
  TEXT: 'text',
  IMAGE: 'image',
  BUTTON: 'button',
  FRAME: 'frame'
} as const;

export const DEFAULT_IMAGE_URL = 'https://placehold.co/600x400?text=Image';
