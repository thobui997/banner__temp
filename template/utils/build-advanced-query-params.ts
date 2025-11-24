import { QueryBuilderParams } from '@gsf/admin/app/shared/types';
import { createOrderByParams } from '@gsf/admin/app/shared/utils';

export const buildAdvancedQueryParams = (params: Partial<QueryBuilderParams>) => {
  const { searchKeyword, sorting } = params;

  const orderBy: string[] = sorting?.orderBy
    ? createOrderByParams(sorting.orderBy, sorting.sortBy, {
        name: 'name'
      })
    : [];

  return {
    advancedSearch: {
      keyword: searchKeyword ?? '',
      fields: ['name']
    },
    ...(orderBy?.length && { orderBy }),
    search: searchKeyword,
    ...(params.pagination && params.pagination)
  };
};
