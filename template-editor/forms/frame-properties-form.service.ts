import { Injectable } from '@angular/core';
import { BasePropertiesFormService } from './base-properties-form.service';
import { FrameProperties } from '../../../types';

@Injectable()
export class FramePropertiesFormService extends BasePropertiesFormService<FrameProperties> {
  createFormControls() {
    return {
     bgColor: ['#FFFFFF']
    };
  }
}
