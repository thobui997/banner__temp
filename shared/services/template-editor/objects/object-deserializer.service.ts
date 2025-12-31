import { inject, Injectable } from '@angular/core';
import { util } from 'fabric';
import { CanvasStateService } from '../canvas/canvas-state.service';
import { VariableType } from '../../../consts';
import { FontPreloaderService } from '@gsf/admin/app/shared/services/font-preloader.service';

@Injectable()
export class ObjectDeserializerService {
  private stateService = inject(CanvasStateService);
  private fontPreloader = inject(FontPreloaderService);

  /**
   * Deserialize and add objects from JSON
   */
  async deserializeAndAddObjects(jsonData: any): Promise<void> {
    const canvas = this.stateService.getCanvas();
    if (!canvas || !jsonData?.objects) return;

    const metadataMap = new Map<number, any>();
    const colorPresetMap = new Map<number, any>();

    // Collect all fonts that need to be loaded
    const fontsToLoad = new Set<string>();

    const cleanObjects = jsonData.objects.map((obj: any, index: number) => {
      if (obj.customMetadata) metadataMap.set(index, obj.customMetadata);
      if (obj.colorPreset) colorPresetMap.set(index, obj.colorPreset);

      // Collect fonts from text objects
      if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'IText') {
        if (obj.fontFamily) {
          fontsToLoad.add(obj.fontFamily);
        }
      }

      // Collect fonts from group objects (buttons)
      if (obj.type === 'group' && obj.objects) {
        obj.objects.forEach((subObj: any) => {
          if (
            (subObj.type === 'textbox' || subObj.type === 'i-text' || subObj.type === 'IText') &&
            subObj.fontFamily
          ) {
            fontsToLoad.add(subObj.fontFamily);
          }
        });
      }

      const { customMetadata, colorPreset, ...rest } = obj;
      if (rest.type === 'textbox' || rest.type === 'i-text') {
        rest.text = rest.text || '';
      }

      return rest;
    });

    try {
      // Load all required fonts before enliving objects
      if (fontsToLoad.size > 0) {
        const fontLoadPromises = Array.from(fontsToLoad).map((font) =>
          this.fontPreloader.loadFontOnDemand(font)
        );

        await Promise.all(fontLoadPromises);

        // Wait for fonts to be ready in DOM
        await this.fontPreloader.waitForFontsReady();

        // Add extra delay to ensure fonts are fully rendered
        await this.delay(100);
      }

      const instances = await util.enlivenObjects(cleanObjects);

      instances.forEach((obj: any, index: number) => {
        if (!obj) return;

        // Disable caching for text objects initially
        if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'IText') {
          obj.objectCaching = false;
          obj.initDimensions();
          obj.setCoords();
        }

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

      // Re-enable caching after render
      requestAnimationFrame(() => {
        instances.forEach((obj: any) => {
          if (obj && (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'IText')) {
            obj.objectCaching = true;
          }
        });
        canvas.requestRenderAll();
      });
    } catch (error) {
      console.error('Error during enliven:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
