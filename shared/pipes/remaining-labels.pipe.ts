import { Pipe, PipeTransform } from '@angular/core';
import { getNestedValue } from '../utils';

@Pipe({ name: 'appRemainingLabels', standalone: true })
export class RemainingLabelsPipe implements PipeTransform {
  transform(value: any[], showItemAmount = 2, field?: string) {
    if (!value || value?.length <= 0) return '';
    const labels: string[] = this.extractLabels(value, field);

    return labels?.slice(showItemAmount).join(', ') ?? '';
  }

  private extractLabels(values: any, field?: string): string[] {
    return values.map((tag: any) => {
      if (typeof tag === 'string') {
        return tag;
      }

      if (field && typeof tag === 'object' && tag !== null) {
        const value = getNestedValue(tag, field);
        return typeof value === 'string' ? value : String(value);
      }

      return String(tag);
    });
  }
}
