import { TableColumn } from '@gsf/admin/app/shared/types';
import { TemplateResponse } from '../types/template.type';
import { RatioEnum } from '../enums/ratio.enum';

export const TemplateColumns: TableColumn<TemplateResponse>[] = [
  {
    def: 'thumbnailFile',
    header: 'Thumbnail',
    width: '143px'
  },
  {
    def: 'name',
    header: 'Template Name',
    width: '591px',
    sortable: true
  },
  {
    def: 'ratio',
    header: 'Ratio',
    width: '246px',
    cell: (row) => (row.ratio === RatioEnum.Ratio1x2 ? '1:2' : '16:9')
  },
  {
    def: 'createdBy',
    header: 'Created by',
    width: '246px'
  },
  {
    def: 'action',
    header: 'Action',
    width: '100px'
  }
];
