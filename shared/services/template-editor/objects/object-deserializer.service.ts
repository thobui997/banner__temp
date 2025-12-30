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

    // Collect all font+weight combinations that need to be loaded
    const fontsToLoad = new Map<string, Set<number>>();

    const cleanObjects = jsonData.objects.map((obj: any, index: number) => {
      if (obj.customMetadata) metadataMap.set(index, obj.customMetadata);
      if (obj.colorPreset) colorPresetMap.set(index, obj.colorPreset);

      // Collect fonts from text objects
      if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'IText') {
        if (obj.fontFamily) {
          this.addFontToLoad(fontsToLoad, obj.fontFamily, obj.fontWeight || 400);
        }
      }

      // Collect fonts from group objects (buttons)
      if (obj.type === 'group' && obj.objects) {
        obj.objects.forEach((subObj: any) => {
          if (
            (subObj.type === 'textbox' || subObj.type === 'i-text' || subObj.type === 'IText') &&
            subObj.fontFamily
          ) {
            this.addFontToLoad(fontsToLoad, subObj.fontFamily, subObj.fontWeight || 400);
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
      // Load all required font+weight combinations before enliving objects
      if (fontsToLoad.size > 0) {
        const fontLoadPromises: Promise<boolean>[] = [];
        
        fontsToLoad.forEach((weights, font) => {
          weights.forEach(weight => {
            fontLoadPromises.push(this.fontPreloader.loadFontOnDemand(font, weight));
          });
        });

        await Promise.all(fontLoadPromises);
        await this.fontPreloader.waitForFontsReady();
      }

      const instances = await util.enlivenObjects(cleanObjects);

      // Create hidden container to pre-render fonts with their specific weights
      const hiddenContainer = this.createHiddenFontContainer(fontsToLoad);

      instances.forEach((obj: any, index: number) => {
        if (!obj) return;

        // Disable caching for text objects initially
        if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'IText') {
          obj.objectCaching = false;
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

      // Wait for browser to render fonts in hidden container
      await this.waitForFontRendering();

      // Clean up hidden container
      if (hiddenContainer.parentNode) {
        hiddenContainer.parentNode.removeChild(hiddenContainer);
      }

      // Force text objects to recalculate dimensions with fully rendered fonts
      instances.forEach((obj: any) => {
        if (obj && (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'IText')) {
          obj.initDimensions();
          obj.setCoords();
          
          requestAnimationFrame(() => {
            obj.objectCaching = true;
            obj.dirty = true;
          });
        }
      });

      canvas.requestRenderAll();

    } catch (error) {
      console.error('Error during enliven:', error);
    }
  }

  /**
   * Add font+weight combination to load map
   */
  private addFontToLoad(fontsMap: Map<string, Set<number>>, font: string, weight: number): void {
    if (!fontsMap.has(font)) {
      fontsMap.set(font, new Set());
    }
    fontsMap.get(font)!.add(weight);
  }

  /**
   * Create hidden container with text in all required fonts and weights
   */
  private createHiddenFontContainer(fonts: Map<string, Set<number>>): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      visibility: hidden;
      pointer-events: none;
      white-space: pre;
    `;

    fonts.forEach((weights, font) => {
      weights.forEach(weight => {
        const textElement = document.createElement('div');
        textElement.style.fontFamily = font;
        textElement.style.fontWeight = weight.toString();
        textElement.style.fontSize = '24px';
        textElement.textContent = 'Choáng váng AaBbCcĐđ 123';
        container.appendChild(textElement);
      });
    });

    document.body.appendChild(container);
    return container;
  }

  /**
   * Wait for fonts to be fully rendered in the DOM
   */
  private waitForFontRendering(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 100);
        });
      });
    });
  }
}