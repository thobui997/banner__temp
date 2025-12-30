import { Pipe, PipeTransform } from '@angular/core';
import { fullPluralizeUtil } from '../utils';

@Pipe({
  name: 'fullPluralize',
  standalone: true
})
export class FullPluralizePipe implements PipeTransform {
  transform(value: number, singular: string, plural?: string): string {
    return fullPluralizeUtil(value, singular, plural);
  }
}
