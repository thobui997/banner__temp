import { inject, Pipe, PipeTransform } from '@angular/core';
import { CurrencyService, LocalStorageService } from '../services';
import { Currency } from '../types';

@Pipe({
  name: 'customCurrency',
  standalone: true
})
export class CurrencyPipe implements PipeTransform {
  private currencyService = inject(CurrencyService);
  private localStorageService = inject(LocalStorageService);

  transform(value: number | string | null | undefined, defaultSymbol?: string): string {
    if (value == null) return '';
    const symbol =
      this.currencyService.currentCurrencySymbol() ||
      (this.localStorageService.getItem(this.currencyService.currencyKey) as Currency).symbol ||
      '$';

    return `${defaultSymbol ?? symbol}${value}`;
  }
}
