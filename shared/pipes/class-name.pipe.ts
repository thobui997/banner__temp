import { Pipe, PipeTransform } from '@angular/core';
import { cn } from '@gsf/utils';

@Pipe({
  name: 'classNames',
  standalone: true,
  pure: true
})
export class ClassNamesPipe implements PipeTransform {
  transform(...classes: any[]): string {
    return cn(...classes);
  }
}
