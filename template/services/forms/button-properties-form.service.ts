import { Injectable } from '@angular/core';
import { ButtonPropertiesFormValues } from '../../types/canvas-object.type';
import { BasePropertiesFormService } from './base-properties-form.service';

@Injectable()
export class ButtonPropertiesFormService extends BasePropertiesFormService<ButtonPropertiesFormValues> {
  createFormControls() {
    return {
      position: this.fb.group({
        x: [0],
        y: [0],
        angle: [0]
      }),
      width: [0],
      height: [0],
      textColor: ['#FFFFFFF'],
      buttonColor: ['#764FDB'],
      fontFamily: [[]],
      fontWeight: [[]],
      fontSize: [[]],
      textAlignment: ['left'],
      text: [''],
      shape: ['rectangle'],
      buttonStyle: ['fill']
    };
  }
}
