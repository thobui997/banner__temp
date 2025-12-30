import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { formatMoneyAbbrev } from '../utils';

@Pipe({
  name: 'moneyAbbrev',
  standalone: true
})
export class MoneyAbbrevPipe implements PipeTransform {
  transform(value: number | null | undefined, fractionDigits = 2): string {
    return formatMoneyAbbrev(value, fractionDigits);
  }
}
