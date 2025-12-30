import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskCard',
  standalone: true
})
export class MarkCardPipe implements PipeTransform {
  transform(value: string | null | undefined, visible = 4): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    const len = str.length;
    if (len <= visible) return str;
    const maskedPart = '*'.repeat(len - visible);
    const visiblePart = str.slice(-visible);
    return maskedPart + visiblePart;
  }
}
