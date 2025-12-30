import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatFileSize', standalone: true })
export class FormatFileSizePipe implements PipeTransform {
  transform(size: number): string {
    if (size >= 1024 * 1024) {
      return (size / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      return (size / 1024).toFixed(2) + ' KB';
    }
  }
}
