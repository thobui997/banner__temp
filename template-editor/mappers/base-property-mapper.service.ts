import { Injectable } from '@angular/core';

/**
 * Generic mapper interface for converting between form and canvas properties
 */
export interface IPropertyMapper<TCanvas, TForm> {
  toFormValues(canvasProps: TCanvas): TForm;
  toCanvasProperties(formValues: Partial<TForm>): Partial<TCanvas>;
}

/**
 * Base property mapper with common position mapping
 */
@Injectable()
export abstract class BasePropertyMapper<
  TCanvas extends { position?: any },
  TForm extends { position?: any }
> implements IPropertyMapper<TCanvas, TForm>
{
  /**
   * Map canvas properties to form values
   */
  abstract toFormValues(canvasProps: TCanvas): TForm;

  /**
   * Map form values to canvas properties
   */
  abstract toCanvasProperties(formValues: Partial<TForm>): Partial<TCanvas>;

  /**
   * Common position mapping helper
   */
  protected mapPosition(position?: { x?: number; y?: number; angle?: number }): {
    x: number;
    y: number;
    angle: number;
  } {
    return {
      x: position?.x ?? 0,
      y: position?.y ?? 0,
      angle: position?.angle ?? 0
    };
  }

  /**
   * Safe number conversion
   */
  protected toNumber(value: any, defaultValue = 0): number {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Safe percentage to decimal (0-100 -> 0-1)
   */
  protected percentToDecimal(percent: any, defaultValue = 1): number {
    const num = this.toNumber(percent, defaultValue * 100);
    return num / 100;
  }

  /**
   * Safe decimal to percentage (0-1 -> 0-100)
   */
  protected decimalToPercent(decimal: any, defaultValue = 1): number {
    const num = this.toNumber(decimal, defaultValue);
    return Math.round(num * 100);
  }
}
