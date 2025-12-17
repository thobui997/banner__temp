import { inject, Injectable } from '@angular/core';
import { util } from 'fabric';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { VariableType } from '../../../consts';

@Injectable()
export class ObjectDeserializerService {
  private stateService = inject(CanvasStateService);

  /**
   * Deserialize and add objects from JSON
   */
  async deserializeAndAddObjects(jsonData: any): Promise<void> {
    const canvas = this.stateService.getCanvas();
    if (!canvas || !jsonData?.objects) return;

    const metadataMap = new Map<number, any>();
    const colorPresetMap = new Map<number, any>();

    const cleanObjects = jsonData.objects.map((obj: any, index: number) => {
      if (obj.customMetadata) metadataMap.set(index, obj.customMetadata);
      if (obj.colorPreset) colorPresetMap.set(index, obj.colorPreset);
      const { customMetadata, colorPreset, ...rest } = obj;
      if (rest.type === 'textbox' || rest.type === 'i-text') {
        rest.text = rest.text || '';
      }

      return rest;
    });

    try {
      const instances = await util.enlivenObjects(cleanObjects);


      instances.forEach((obj: any, index: number) => {
        if (!obj) return;

        if (metadataMap.has(index)) {
          obj.set('customMetadata', metadataMap.get(index));
        }
        if (colorPresetMap.has(index)) {
          obj.set('colorPreset', colorPresetMap.get(index));
        }

        const metadata = metadataMap.get(index);
        if (metadata?.type === VariableType.FRAME) {
          this.stateService.updateFrameObject(obj);
          canvas.add(obj);
          canvas.sendObjectToBack(obj);
        } else {
          canvas.add(obj);
        }

      });

      canvas.requestRenderAll();
    } catch (error) {
      console.error('Error during enliven:', error);
    }
  }
}
