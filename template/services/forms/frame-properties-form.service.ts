import { Injectable } from '@angular/core';
import { FrameProperties } from '../../types/canvas-object.type';
import { BasePropertiesFormService } from './base-properties-form.service';

@Injectable()
export class FramePropertiesFormService extends BasePropertiesFormService<FrameProperties> {
  createFormControls() {
    return {
     bgColor: ['#FFFFFF']
    };
  }
}
