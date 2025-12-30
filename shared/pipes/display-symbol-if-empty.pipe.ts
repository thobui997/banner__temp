import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'displaySymbolIfEmpty',
  standalone: true
})
export class DisplaySymbolIfEmptyPipe implements PipeTransform {
  transform(value: null | undefined | string, symbol = '-'): string {
    return value || symbol;
  }
}
