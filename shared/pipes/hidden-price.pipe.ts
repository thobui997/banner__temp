import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hiddenPrice',
  standalone: true
})
export class HiddenPricePipe implements PipeTransform {
  transform(value: number | string | null | undefined, isHidden: boolean): string {
    if (!isHidden) {
      return String(value ?? '');
    }

    if (value === null || value === undefined || value === '') {
      return '';
    }

    const strValue = String(value);

    if (strValue.includes('.')) {
      const [integer, decimals] = strValue.split('.');
      return `${'*'.repeat(integer.length)}.${'*'.repeat(decimals.length)}`;
    }

    return '*'.repeat(strValue.length);
  }
}
