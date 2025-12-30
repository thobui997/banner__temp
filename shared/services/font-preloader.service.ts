import { inject, Injectable } from '@angular/core';
import { from, Observable, forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { fontFamily } from '../consts';
import { FontWeightManagerService } from './font-weight-manager.service';

export interface FontLoadResult {
  fontFamily: string;
  loaded: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FontPreloaderService {
  private fontWeightManager = inject(FontWeightManagerService);
  private loadedFonts = new Map<string, Set<number>>();
  private loadingPromise: Promise<FontLoadResult[]> | null = null;

  // Google Fonts base URL
  private readonly GOOGLE_FONTS_BASE = 'https://fonts.googleapis.com/css2';

  preloadAllFonts(): Observable<FontLoadResult[]> {
    if (this.loadingPromise) {
      return from(this.loadingPromise);
    }

    const fontFamilies = fontFamily.map((f) => f.value);

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
    this.loadingPromise = firstValueFrom(observable);

    return observable;
  }

  private loadSingleFont(fontFamily: string): Observable<FontLoadResult> {
    return from(this.loadFontAsync(fontFamily)).pipe(
      map(() => {
        return {
          fontFamily,
          loaded: true
        } as FontLoadResult;
      })
    );
  }

  /**
   * Load font with all required weights using FontFace API
   */
  private async loadFontAsync(fontFamily: string, weight?: number): Promise<void> {
    const fontName = this.extractFontName(fontFamily);
    
    if (!('fonts' in document)) {
      console.warn('FontFace API not supported');
      return Promise.resolve();
    }

    const weightsToLoad = weight 
      ? [weight] 
      : this.getAvailableWeights(fontFamily);

    const loadPromises = weightsToLoad.map(async (w) => {
      // Check if already loaded
      const loadedWeights = this.loadedFonts.get(fontFamily);
      if (loadedWeights?.has(w)) {
        return;
      }

      try {
        // Get font URL from Google Fonts
        const fontUrl = await this.getFontUrl(fontName, w);
        
        // Create FontFace instance
        const fontFace = new FontFace(fontName, `url(${fontUrl})`, {
          style: 'normal',
          weight: w.toString(),
          display: 'swap'
        });

        // Load the font
        await fontFace.load();

        // Add to document fonts
        (document as any).fonts.add(fontFace);

        // Track loaded font
        if (!this.loadedFonts.has(fontFamily)) {
          this.loadedFonts.set(fontFamily, new Set());
        }
        this.loadedFonts.get(fontFamily)!.add(w);

        console.log(`✓ Loaded ${fontName} weight ${w}`);
      } catch (error) {
        console.warn(`Failed to load ${fontName} weight ${w}:`, error);
      }
    });

    await Promise.all(loadPromises);
    
    // Wait for fonts to be ready in document
    await (document as any).fonts.ready;
  }

  /**
   * Get font URL from Google Fonts API
   */
  private async getFontUrl(fontFamily: string, weight: number): Promise<string> {
    // Build Google Fonts CSS URL
    const fontParam = fontFamily.replace(/ /g, '+');
    const url = `${this.GOOGLE_FONTS_BASE}?family=${fontParam}:wght@${weight}&display=swap`;

    try {
      // Fetch CSS from Google Fonts
      const response = await fetch(url);
      const cssText = await response.text();

      // Extract woff2 URL from CSS
      const woff2Match = cssText.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
      
      if (woff2Match && woff2Match[1]) {
        return woff2Match[1];
      }

      throw new Error(`Could not extract font URL for ${fontFamily} weight ${weight}`);
    } catch (error) {
      console.error(`Error fetching font URL for ${fontFamily}:`, error);
      throw error;
    }
  }

  private getAvailableWeights(fontFamily: string): number[] {
    const weights = this.fontWeightManager.getAvailableWeights(fontFamily);
    return weights.map(w => w.value);
  }

  async loadFontOnDemand(fontFamily: string, weight?: number): Promise<boolean> {
    if (weight) {
      const loadedWeights = this.loadedFonts.get(fontFamily);
      if (loadedWeights?.has(weight)) {
        return true;
      }
    }

    try {
      await this.loadFontAsync(fontFamily, weight);
      return true;
    } catch (error) {
      console.error(`Failed to load font ${fontFamily} weight ${weight}:`, error);
      return false;
    }
  }

  private extractFontName(fontValue: string): string {
    return fontValue.replace(/['"]/g, '').split(',')[0].trim();
  }

  isFontLoaded(fontFamily: string, weight?: number): boolean {
    const loadedWeights = this.loadedFonts.get(fontFamily);
    
    if (!loadedWeights) return false;
    if (!weight) return loadedWeights.size > 0;
    
    return loadedWeights.has(weight);
  }

  getLoadedFonts(): Map<string, Set<number>> {
    return new Map(this.loadedFonts);
  }

  waitForFontsReady(): Promise<void> {
    if ('fonts' in document) {
      return (document as any).fonts.ready;
    }
    return Promise.resolve();
  }

  clearCache(): void {
    this.loadedFonts.clear();
    this.loadingPromise = null;
  }
}