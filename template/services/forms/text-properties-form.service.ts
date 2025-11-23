import { Injectable } from '@angular/core';
import { TextPropertiesFormValues } from '../../types/canvas-object.type';
import { BasePropertiesFormService } from './base-properties-form.service';

@Injectable()
export class TextPropertiesFormService extends BasePropertiesFormService<TextPropertiesFormValues> {
  createFormControls() {
    return {
      position: this.fb.group({
        x: [0],
        y: [0],
        angle: [0]
      }),
      textColor: ['#000000'],
      fontFamily: [[]],
      fontWeight: [[]],
      fontSize: [[]],
      textAlignment: ['left'],
      text: ['']
    };
  }
}
