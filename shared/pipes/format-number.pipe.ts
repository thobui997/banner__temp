import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatNumber', standalone: true })
export class FormatNumberPipe implements PipeTransform {
  transform(value: string | number): string | number {
    if (value == undefined) return value;
    if (isNaN(Number(value))) return value;

    const [integerPart, fractionalPart] = value
      .toString()
      .replace(/[^0-9.-]/g, '')
      .split('.');

    const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Add commas
    return fractionalPart ? `${formattedIntegerPart}.${fractionalPart}` : `${formattedIntegerPart}`;
  }
}
