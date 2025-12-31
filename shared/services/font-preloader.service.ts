import { Injectable } from '@angular/core';
import { from, Observable, forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { fontFamily } from '../consts';

export interface FontLoadResult {
  fontFamily: string;
  loaded: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FontPreloaderService {
  private loadedFonts = new Set<string>();
  private loadingPromise: Promise<FontLoadResult[]> | null = null;

  /**
   * Preload all fonts defined in text-font.const.ts
   */
  preloadAllFonts(): Observable<FontLoadResult[]> {
    // If already loading, return existing promise
    if (this.loadingPromise) {
      return from(this.loadingPromise);
    }

    // Get all font families from config
    const fontFamilies = fontFamily.map((f) => this.extractFontName(f.value));

    // Load all fonts in parallel
    const loadObservables = fontFamilies.map((fontName) =>
      this.loadSingleFont(fontName).pipe(
        catchError((error) =>
          of({
            fontFamily: fontName,
            loaded: false,
            error: error.message
          } as FontLoadResult)
        )
      )
    );

    const observable = forkJoin(loadObservables);

    // Cache the loading promise
    this.loadingPromise = firstValueFrom(observable);

    return observable;
  }

  /**
   * Load a single font using Font Loading API
   */
  private loadSingleFont(fontFamily: string): Observable<FontLoadResult> {
    return from(this.loadFontAsync(fontFamily)).pipe(
      map(() => {
        this.loadedFonts.add(fontFamily);
        return {
          fontFamily,
          loaded: true
        } as FontLoadResult;
      })
    );
  }

  /**
   * Load font asynchronously using Font Loading API with proper verification
   */
  private async loadFontAsync(fontFamily: string): Promise<void> {
    // Check if font is already loaded
    if (this.loadedFonts.has(fontFamily)) {
      return Promise.resolve();
    }

    // Check if Font Loading API is available
    if (!('fonts' in document)) {
      return Promise.resolve();
    }

    const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
    const loadPromises = weights.map((weight) =>
      (document as any).fonts.load(`${weight} 24px "${fontFamily}"`)
    );

    await Promise.all(loadPromises);

    // Wait for fonts to be ready in DOM
    await (document as any).fonts.ready;

    // Verify font is actually loaded by checking availability
    const isFontAvailable = await this.verifyFontLoaded(fontFamily);

    if (!isFontAvailable) {
      throw new Error(`Font ${fontFamily} not available after loading`);
    }
  }

  /**
   * Verify font is actually loaded and available
   */
  private async verifyFontLoaded(fontFamily: string): Promise<boolean> {
    // Create a test element to verify font rendering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return false;

    // Measure text with the target font
    ctx.font = `16px "${fontFamily}"`;
    const targetWidth = ctx.measureText('abcdefghijklmnopqrstuvwxyz').width;

    // Measure text with fallback font
    ctx.font = '16px sans-serif';
    const fallbackWidth = ctx.measureText('abcdefghijklmnopqrstuvwxyz').width;

    // If widths are different, font is loaded
    return Math.abs(targetWidth - fallbackWidth) > 1;
  }

  /**
   * Load a specific font on-demand (used when creating/updating text objects)
   */
  async loadFontOnDemand(fontFamily: string): Promise<boolean> {
    const fontName = this.extractFontName(fontFamily);

    if (this.loadedFonts.has(fontName)) {
      return true;
    }

    try {
      await this.loadFontAsync(fontName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract font name from font value string
   * Example: '"Roboto", serif' => 'Roboto'
   */
  private extractFontName(fontValue: string): string {
    // Remove quotes and everything after comma
    return fontValue.replace(/['"]/g, '').split(',')[0].trim();
  }

  /**
   * Check if a font is loaded
   */
  isFontLoaded(fontFamily: string): boolean {
    const fontName = this.extractFontName(fontFamily);
    return this.loadedFonts.has(fontName);
  }

  /**
   * Get all loaded fonts
   */
  getLoadedFonts(): string[] {
    return Array.from(this.loadedFonts);
  }

  /**
   * Wait for fonts to be ready (alternative method using FontFaceSet)
   */
  waitForFontsReady(): Promise<void> {
    if ('fonts' in document) {
      return (document as any).fonts.ready;
    }
    return Promise.resolve();
  }

  /**
   * Clear loaded fonts cache (for testing)
   */
  clearCache(): void {
    this.loadedFonts.clear();
    this.loadingPromise = null;
  }
}
