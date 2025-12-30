import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyMoneyFormat',
  standalone: true
})
export class CurrencyMoneyFormatPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    currencyCode: string | 'USD' | 'VND' | 'EUR' = 'USD',
    locale: string | 'en-US' | 'vi-VN' | 'de-DE' = 'en-US'
  ): string {
    if (value == null || isNaN(value)) return '';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(
      value
    );
  }
}
