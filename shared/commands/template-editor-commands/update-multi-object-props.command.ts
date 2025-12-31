import { Canvas, FabricObject } from 'fabric';
import { Command } from '../../types';
import * as FontFaceObserver from 'fontfaceobserver';

interface ObjectUpdate {
  object: FabricObject;
  properties: Record<string, any>;
}

export class UpdateMultiObjectPropsCommand extends Command {
  private updates: Array<{
    object: FabricObject;
    oldProperties: Record<string, any>;
    newProperties: Record<string, any>;
  }> = [];

  private syncForm?: () => void;
  private afterUpdate?: () => void;

  constructor(
    private canvas: Canvas,
    objectUpdates: ObjectUpdate[],
    options?: {
      syncForm?: () => void;
      afterUpdate?: () => void;
    }
  ) {
    super();

    this.syncForm = options?.syncForm;
    this.afterUpdate = options?.afterUpdate;

    // Store old and new properties for each object
    objectUpdates.forEach(({ object, properties }) => {
      const oldProperties: Record<string, any> = {};
      const newProperties: Record<string, any> = {};

      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined) {
          oldProperties[key] = object.get(key);
          newProperties[key] = value;
        }
      });

      if (Object.keys(newProperties).length > 0) {
        this.updates.push({
          object,
          oldProperties,
          newProperties
        });
      }
    });
  }

  async execute() {
    await this.applyUpdates(true);
  }

  async undo() {
    await this.applyUpdates(false);
    this.syncForm?.();
  }

  override async redo() {
    await this.applyUpdates(true);
    this.syncForm?.();
  }

  private async applyUpdates(useNewProperties: boolean): Promise<void> {
    const fontsToLoad = new Set<string>();

    this.updates.forEach(({ newProperties, oldProperties }) => {
      const properties = useNewProperties ? newProperties : oldProperties;

      if (properties['fontFamily']) {
        const primaryFont = this.extractPrimaryFont(properties['fontFamily']);
        if (primaryFont) {
          fontsToLoad.add(primaryFont);
        }
      }
    });

    // Load fonts if any font changes detected
    if (fontsToLoad.size > 0) {
      await this.loadFonts(fontsToLoad);
    }

    // Apply all updates
    this.updates.forEach(({ object, oldProperties, newProperties }) => {
      const properties = useNewProperties ? newProperties : oldProperties;

      Object.entries(properties).forEach(([key, value]) => {
        object.set(key as any, value);
      });

      if (
        (object.type === 'textbox' ||
          object.type === 'Textbox' ||
          object.type === 'i-text' ||
          object.type === 'IText') &&
        properties['fontFamily']
      ) {
        if ('initDimensions' in object && typeof object.initDimensions === 'function') {
          object.initDimensions();
        }
      }

      object.set('dirty', true);
      object.setCoords();
    });

    this.afterUpdate?.();
    this.canvas.renderAll();
  }

  private async loadFonts(fonts: Set<string>): Promise<void> {
    if (fonts.size === 0) return;

    const fontPromises = Array.from(fonts).map(async (fontFamily) => {
      try {
        const observer = new FontFaceObserver(fontFamily);
        await observer.load(null, 5000);
      } catch (err) {
        console.warn(`Font failed to load: ${fontFamily}`, err);
      }
    });

    await Promise.all(fontPromises);

    // Wait for font metrics to stabilize
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  private extractPrimaryFont(fontFamily: string): string | null {
    if (!fontFamily || typeof fontFamily !== 'string') {
      return null;
    }

    const fonts = fontFamily.split(',').map((f) => f.trim());

    if (fonts.length === 0) {
      return null;
    }

    let primaryFont = fonts[0];

    primaryFont = primaryFont.replace(/^['"]|['"]$/g, '');

    const genericFonts = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'];
    if (genericFonts.includes(primaryFont.toLowerCase())) {
      for (let i = 1; i < fonts.length; i++) {
        const font = fonts[i].replace(/^['"]|['"]$/g, '').trim();
        if (!genericFonts.includes(font.toLowerCase())) {
          return font;
        }
      }
      return null;
    }

    return primaryFont;
  }
}
