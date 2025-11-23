import { Injectable } from '@angular/core';
import { VariableType } from '../../consts/variables.const';
import { FrameProperties } from '../../types/canvas-object.type';
import { BasePropertyMapper } from './base-property-mapper.service';

@Injectable()
export class FramePropertyMapper extends BasePropertyMapper<FrameProperties, FrameProperties> {
  toFormValues(props: FrameProperties): FrameProperties {
    return {
      type: VariableType.FRAME,
      bgColor: props.bgColor
    };
  }

  toCanvasProperties(formValues: Partial<FrameProperties>): Partial<FrameProperties> {
    return {
      type: VariableType.FRAME,
      bgColor: formValues.bgColor
    };
  }
}
