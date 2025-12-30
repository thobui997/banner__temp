import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { BasePropertiesFormService } from './base-properties-form.service';
import { ImageProperties } from '../../../types';

@Injectable()
export class ImagePropertiesFormService extends BasePropertiesFormService<ImageProperties> {
  createFormControls() {
    return {
      position: this.fb.group({
        x: [0],
        y: [0],
        angle: [0]
      }),
      width: [0],
      height: [0],
      cornerRadius: [0],
      opacity: [100, [Validators.max(100)]],
      attachments: [[]]
    };
  }
}
