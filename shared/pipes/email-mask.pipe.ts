import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'emailMask',
  standalone: true
})
export class EmailMaskPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    const email = value.trim();
    const atIndex = email.indexOf('@');

    if (atIndex === -1) {
      return email;
    }

    const localPart = email.slice(0, atIndex);
    const domainPart = email.slice(atIndex);

    if (localPart.length <= 4) {
      return localPart + domainPart;
    }

    const firstChar = localPart[0];
    const lastChars = localPart.slice(-3);
    const masked = '*'.repeat(localPart.length - 4);

    return firstChar + masked + lastChars + domainPart;
  }
}
