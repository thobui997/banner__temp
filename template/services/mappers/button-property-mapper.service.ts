import { Injectable } from '@angular/core';
import { fontFamily, fontSizes, fontWeights } from '../../consts/text-font.const';
import { VariableType } from '../../consts/variables.const';
import { ButtonProperties, ButtonPropertiesFormValues } from '../../types/canvas-object.type';
import { BasePropertyMapper } from './base-property-mapper.service';

@Injectable()
export class ButtonPropertyMapper extends BasePropertyMapper<
  ButtonProperties,
  ButtonPropertiesFormValues
> {
  toFormValues(props: ButtonProperties): ButtonPropertiesFormValues {
    return {
      type: VariableType.BUTTON,
      position: this.mapPosition(props.position),
      width: Math.round(props.width || 0),
      height: Math.round(props.height || 0),
      fontFamily: [fontFamily.find((f) => f.value === props.fontFamily) ?? fontFamily[0]],
      fontWeight: [fontWeights.find((w) => w.value === props.fontWeight) ?? fontWeights[0]],
      fontSize: [fontSizes.find((s) => s.value === props.fontSize) ?? fontSizes[4]],
      textColor: props.textColor || '#000000',
      text: props.text || '',
      textAlignment: props.textAlignment || 'left',
      buttonColor: props.buttonColor,
      shape: props.shape,
      buttonStyle: props.style
    };
  }

  toCanvasProperties(formValues: Partial<ButtonPropertiesFormValues>): Partial<ButtonProperties> {
    return {
      type: VariableType.BUTTON,
      position: formValues.position
        ? {
            x: this.toNumber(formValues.position.x),
            y: this.toNumber(formValues.position.y),
            angle: this.toNumber(formValues.position.angle)
          }
        : undefined,
      width: formValues.width,
      height: formValues.height,
      fontFamily: formValues.fontFamily?.[0]?.value || 'Arial',
      fontWeight: formValues.fontWeight?.[0]?.value || 400,
      fontSize: formValues.fontSize?.[0]?.value || 24,
      textColor: formValues.textColor,
      text: formValues.text,
      textAlignment: formValues.textAlignment,
      buttonColor: formValues.buttonColor,
      shape: formValues.shape,
      style: formValues.buttonStyle
    };
  }
}
