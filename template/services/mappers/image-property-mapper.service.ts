import { Injectable } from '@angular/core';
import { VariableType } from '../../consts/variables.const';
import { ImageProperties } from '../../types/canvas-object.type';
import { BasePropertyMapper } from './base-property-mapper.service';

@Injectable()
export class ImagePropertyMapper extends BasePropertyMapper<ImageProperties, ImageProperties> {
  toFormValues(props: ImageProperties): ImageProperties {
    return {
      type: VariableType.IMAGE,
      position: this.mapPosition(props.position),
      width: Math.round(props.width || 0),
      height: Math.round(props.height || 0),
      cornerRadius: props.cornerRadius || 0,
      opacity: this.decimalToPercent(props.opacity, 1),
      attachments: props?.attachments || []
    };
  }

  toCanvasProperties(formValues: Partial<ImageProperties>): Partial<ImageProperties> {
    return {
      type: VariableType.IMAGE,
      position: formValues.position,
      width: formValues.width,
      height: formValues.height,
      cornerRadius: formValues.cornerRadius,
      opacity: this.percentToDecimal(formValues.opacity, 1),
      attachments: formValues.attachments
    };
  }
}
