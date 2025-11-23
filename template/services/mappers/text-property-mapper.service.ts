import { Injectable } from '@angular/core';
import { fontFamily, fontSizes, fontWeights } from '../../consts/text-font.const';
import { TextProperties, TextPropertiesFormValues } from '../../types/canvas-object.type';
import { BasePropertyMapper } from './base-property-mapper.service';

@Injectable()
export class TextPropertyMapper extends BasePropertyMapper<
  TextProperties,
  TextPropertiesFormValues
> {
  toFormValues(props: TextProperties): TextPropertiesFormValues {
    return {
      type: 'text',
      position: this.mapPosition(props.position),
      fontFamily: [fontFamily.find((f) => f.value === props.fontFamily) ?? fontFamily[0]],
      fontWeight: [fontWeights.find((w) => w.value === props.fontWeight) ?? fontWeights[0]],
      fontSize: [fontSizes.find((s) => s.value === props.fontSize) ?? fontSizes[4]],
      textColor: props.textColor || '#000000',
      text: props.text || '',
      textAlignment: props.textAlignment || 'left'
    };
  }

  toCanvasProperties(formValues: Partial<TextPropertiesFormValues>): Partial<TextProperties> {
    return {
      type: 'text',
      position: formValues.position
        ? {
            x: this.toNumber(formValues.position.x),
            y: this.toNumber(formValues.position.y),
            angle: this.toNumber(formValues.position.angle)
          }
        : undefined,
      fontFamily: formValues.fontFamily?.[0]?.value || 'Arial',
      fontWeight: formValues.fontWeight?.[0]?.value || 400,
      fontSize: formValues.fontSize?.[0]?.value || 24,
      textColor: formValues.textColor,
      text: formValues.text,
      textAlignment: formValues.textAlignment
    };
  }
}
