import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneMark',
  standalone: true
})
export class PhoneMarkPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (!value) return '';

    const phone = value.toString().trim();
    const len = phone.length;

    if (len <= 4) return phone;

    const firstDigit = phone[0];
    const lastDigits = phone.slice(-3);
    const masked = '*'.repeat(len - 4);

    return firstDigit + masked + lastDigits;
  }
}
