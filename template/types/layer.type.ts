import { FabricObject } from 'fabric/*';
import { VariableType } from './variable.type';

export interface Layer {
  id: string;
  name: string;
  type: VariableType;
  visible: boolean;
  locked: boolean;
  fabricObject?: FabricObject;
  isEditingName?: boolean;
}
