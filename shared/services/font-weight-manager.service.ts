// template-editor/services/font-weight-manager.service.ts
import { Injectable } from '@angular/core';
import { Option } from '@gsf/ui';

export interface FontWeightConfig {
  weights: number[];
  defaultWeight: number;
}

@Injectable({
  providedIn: 'root'
})
export class FontWeightManagerService {
  // Map font families to their available weights
  private readonly fontWeightsMap: Record<string, FontWeightConfig> = {
    Roboto: {
      weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    'Open Sans': {
      weights: [300, 400, 500, 600, 700, 800],
      defaultWeight: 400
    },
    Lato: {
      weights: [100, 300, 400, 700, 900],
      defaultWeight: 400
    },
    Montserrat: {
      weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    Poppins: {
      weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    Oswald: {
      weights: [200, 300, 400, 500, 600, 700],
      defaultWeight: 400
    },
    'Source Sans 3': {
      weights: [200, 300, 400, 600, 700, 900],
      defaultWeight: 400
    },
    Inter: {
      weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    Raleway: {
      weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    Merriweather: {
      weights: [300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    'Playfair Display': {
      weights: [400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    Ubuntu: {
      weights: [300, 400, 500, 700],
      defaultWeight: 400
    },
    Nunito: {
      weights: [200, 300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    'PT Serif': {
      weights: [400, 700],
      defaultWeight: 400
    },
    'Bebas Neue': {
      weights: [400],
      defaultWeight: 400
    },
    Barlow: {
      weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    Manrope: {
      weights: [200, 300, 400, 500, 600, 700, 800],
      defaultWeight: 400
    },
    'Fira Sans': {
      weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    'Noto Sans': {
      weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    'DM Sans': {
      weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    Kanit: {
      weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      defaultWeight: 400
    },
    Quicksand: {
      weights: [300, 400, 500, 600, 700],
      defaultWeight: 400
    },
    'Varela Round': {
      weights: [400],
      defaultWeight: 400
    },
    'Libre Baskerville': {
      weights: [400, 500, 600, 700],
      defaultWeight: 400
    },
    Cabin: {
      weights: [400, 500, 600, 700],
      defaultWeight: 400
    }
  };

  private readonly weightLabels: Record<number, string> = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'SemiBold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black'
  };

  /**
   * Get available weights for a font family as Option array
   */
  getAvailableWeights(fontFamily: string): Option<number>[] {
    const config = this.fontWeightsMap[fontFamily];

    if (!config) {
      return this.getDefaultWeightOptions();
    }

    return config.weights.map((weight) => ({
      name: this.weightLabels[weight] || weight.toString(),
      value: weight
    }));
  }

  /**
   * Get default weight for a font family
   */
  getDefaultWeight(fontFamily: string): number {
    const config = this.fontWeightsMap[fontFamily];
    return config?.defaultWeight || 400;
  }

  /**
   * Check if a weight is available for a font family
   */
  isWeightAvailable(fontFamily: string, weight: number): boolean {
    const config = this.fontWeightsMap[fontFamily];
    if (!config) return weight === 400 || weight === 700;
    return config.weights.includes(weight);
  }

  /**
   * Get closest available weight for a font family
   */
  getClosestAvailableWeight(fontFamily: string, targetWeight: number): number {
    const config = this.fontWeightsMap[fontFamily];

    if (!config) {
      return targetWeight <= 500 ? 400 : 700;
    }

    if (config.weights.includes(targetWeight)) {
      return targetWeight;
    }

    // Find closest weight
    return config.weights.reduce((prev, curr) => {
      return Math.abs(curr - targetWeight) < Math.abs(prev - targetWeight) ? curr : prev;
    });
  }

  private getDefaultWeightOptions(): Option<number>[] {
    return [
      { name: 'Regular', value: 400 },
      { name: 'Bold', value: 700 }
    ];
  }

  getWeightLabel(weight: number): string {
    return this.weightLabels[weight] || weight.toString();
  }

  getConfiguredFontFamilies(): string[] {
    return Object.keys(this.fontWeightsMap);
  }
}
