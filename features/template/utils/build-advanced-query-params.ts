import { AdvancedFilter, QueryBuilderParams } from '@gsf/admin/app/shared/types';
import {
  convertDateToISOString,
  createCompositeFilter,
  createOrderByParams,
  createOrQuery
} from '@gsf/admin/app/shared/utils';
import { Option } from '@gsf/ui';
import { TemplateListRequest } from '../types/template.type';

export const buildAdvancedQueryParams = (
  params: Partial<QueryBuilderParams>
): TemplateListRequest => {
  const { searchKeyword, sorting, allFilters } = params;

  const advancedFilters: AdvancedFilter[] = [];

  const orderBy: string[] = sorting?.orderBy
    ? createOrderByParams(sorting.orderBy, sorting.sortBy, {
        name: 'name'
      })
    : [];

  const createdAtFilter = createCompositeFilter([
    {
      field: 'createdOn',
      value: convertDateToISOString(allFilters?.['createdOn']?.[0], 'start'),
      operator: 'gte'
    },
    {
      field: 'createdOn',
      value: convertDateToISOString(allFilters?.['createdOn']?.[1], 'end'),
      operator: 'lte'
    }
  ]);

  if (createdAtFilter) advancedFilters.push(createdAtFilter);

  const ratioValues = allFilters?.['ratio']?.map((option: Option) => option.value);
  const ratioFilter = createOrQuery('ratio', ratioValues);
  if (ratioFilter) advancedFilters.push(ratioFilter);

  const assignedUsers = allFilters?.['createdBy']?.map((option: Option) => option.value) || [];

  return {
    advancedSearch: {
      keyword: searchKeyword ?? '',
      fields: ['name']
    },
    createdByIds: assignedUsers,
    ...(advancedFilters.length && {
      advancedFilter: {
        logic: 'and',
        filters: advancedFilters
      }
    }),
    ...(orderBy?.length && { orderBy }),
    ...(params.pagination && params.pagination)
  };
};
