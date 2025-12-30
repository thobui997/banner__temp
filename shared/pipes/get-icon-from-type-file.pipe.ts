import { Pipe, PipeTransform } from '@angular/core';
import { TypeIconFileMap } from '../consts/type-file-map.const';
import { ICON_FILE } from '@gsf/ui';

@Pipe({
  name: 'getIconFromTypeFile',
  standalone: true
})
export class GetIconFromTypeFilePipe implements PipeTransform {
  transform(nameFile: string): string {
    const ext = nameFile.split('.').pop()?.toLowerCase() ?? '';
    return TypeIconFileMap[ext] ?? ICON_FILE;
  }
}
