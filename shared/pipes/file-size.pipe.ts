import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true
})
export class FileSizePipe implements PipeTransform {
  private readonly units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  transform(
    bytes: number | string,
    precision = 2,
    options?: {
      binary?: boolean;
      showUnit?: boolean;
      separator?: string;
      unitCase?: 'upper' | 'lower';
    }
  ): string {
    // Convert string to number if needed
    const numericBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;

    // Handle invalid input
    if (isNaN(numericBytes) || numericBytes < 0) {
      return '0 B';
    }

    // Handle zero
    if (numericBytes === 0) {
      return '0 B';
    }

    // Default options
    const opts = {
      binary: true,
      showUnit: true,
      separator: ' ',
      unitCase: 'upper' as const,
      ...options
    };

    const base = opts.binary ? 1024 : 1000;
    const unitIndex = Math.floor(Math.log(numericBytes) / Math.log(base));
    const value = numericBytes / Math.pow(base, unitIndex);

    // Format the number
    const formattedValue = this.formatNumber(value, precision);

    if (!opts.showUnit) {
      return formattedValue;
    }

    // Get unit
    let unit = this.units[Math.min(unitIndex, this.units.length - 1)];

    // Apply unit case
    if (opts.unitCase === 'lower') {
      unit = unit.toLowerCase();
    }

    return `${formattedValue}${opts.separator}${unit}`;
  }

  private formatNumber(value: number, precision: number): string {
    // Remove trailing zeros
    return parseFloat(value.toFixed(precision)).toString();
  }
}
