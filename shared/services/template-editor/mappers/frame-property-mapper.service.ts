import { Injectable } from '@angular/core';
import { BasePropertyMapper } from './base-property-mapper.service';
import { FrameProperties } from '../../../types';
import { VariableType } from '../../../consts';

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
