export type VariableType = 'text' | 'image' | 'button' | 'frame' | 'shape';

export interface Variable {
  label: string;
  icon: string;
  type: VariableType;
}
