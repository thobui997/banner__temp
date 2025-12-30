import { Pipe, PipeTransform } from '@angular/core';
import {
  ICON_FILE_DOC,
  ICON_FILE_DOCX,
  ICON_FILE_JPG,
  ICON_FILE_PDF_V2,
  ICON_FILE_PNG,
  ICON_FILE_PPT,
  ICON_FILE_PPTX,
  ICON_FILE_SVG,
  ICON_FILE_XLS,
  ICON_FILE_XLSX_V2
} from '@gsf/ui';

export interface FileIconConfig {
  icon: string;
}

@Pipe({
  name: 'fileIcon',
  standalone: true
})
export class FileIconPipe implements PipeTransform {
  private readonly fileIconMap: { [key: string]: FileIconConfig } = {
    // Documents
    pdf: { icon: ICON_FILE_PDF_V2 },
    doc: { icon: ICON_FILE_DOC },
    docx: { icon: ICON_FILE_DOCX },
    ppt: { icon: ICON_FILE_PPT },
    pptx: { icon: ICON_FILE_PPTX },

    // Spreadsheets
    xls: { icon: ICON_FILE_XLS },
    xlsx: { icon: ICON_FILE_XLSX_V2 },

    // media
    jpg: { icon: ICON_FILE_JPG },
    jpeg: { icon: ICON_FILE_JPG },
    png: { icon: ICON_FILE_PNG },
    svg: { icon: ICON_FILE_SVG }
  };

  transform(fileName: string) {
    if (!fileName) {
      return '';
    }

    const extension = this.getFileExtension(fileName);
    const config = this.fileIconMap[extension];

    if (!config) return '';

    return config.icon ?? '';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) return '';
    return fileName.slice(lastDot + 1).toLowerCase();
  }
}
