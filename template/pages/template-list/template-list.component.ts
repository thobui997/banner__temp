import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  DeleteButtonComponent,
  EditButtonComponent,
  PageListWrapperComponent,
  PageTitleComponent
} from '@gsf/admin/app/shared/components';
import { AppTableComponent } from '@gsf/admin/app/shared/components/app-table/app-table.component';
import { PageLayoutComponent } from '@gsf/admin/app/shared/layouts';
import { AdvancedSearchService, PaginationService } from '@gsf/admin/app/shared/services';
import { ButtonDirective, ICON_ADD_OUTLINE, IconSvgComponent } from '@gsf/ui';
import { TemplateColumns } from '../../consts/template-colums';
import { combineLatest, map, switchMap, tap } from 'rxjs';
import { Destroyer } from '@gsf/admin/app/shared/base';
import { WithRefreshable } from '@gsf/admin/app/shared/mixins';
import { TemplateApiService } from '../../services/api/template-api.service';
import { buildAdvancedQueryParams } from '../../utils/build-advanced-query-params';
import { CellDefDirective } from '@gsf/admin/app/shared/directives';
import { FilterField } from '@gsf/admin/app/shared/types';

const BaseComponent = WithRefreshable(Destroyer);

@Component({
  selector: 'app-template-list',
  standalone: true,
  templateUrl: './template-list.component.html',
  imports: [
    CommonModule,
    PageLayoutComponent,
    AppTableComponent,
    PageListWrapperComponent,
    PageTitleComponent,
    IconSvgComponent,
    ButtonDirective,
    DeleteButtonComponent,
    EditButtonComponent,
    CellDefDirective
  ],
  providers: [AdvancedSearchService, PaginationService, TemplateApiService]
})
export class TemplateListComponent extends BaseComponent {
  private router = inject(Router);
  private advancedSearchService = inject(AdvancedSearchService);
  private paginationService = inject(PaginationService);
  private api = inject(TemplateApiService);

  ICON_ADD_OUTLINE = ICON_ADD_OUTLINE;

  tableColumns = TemplateColumns;

  filterConfiguration = computed<FilterField[]>(() => [
    {
      type: 'select',
      key: 'ratio',
      label: 'Ratio',
      placeholder: 'Select ratio',
      options: [],
      isMultipleSelect: false,
      showSearchBox: false
    },
    {
      type: 'select',
      key: 'createdBy',
      label: 'Created By',
      placeholder: 'Select users',
      options: [],
      maxDisplayItem: 2,
      isMultipleSelect: true,
      showSearchBox: true
    },
    {
      type: 'date-range',
      key: 'creratedAt',
      label: 'Created at',
      showFooter: false
    }
  ]);

  sourceList$ = combineLatest([
    this.advancedSearchService.searchTerm$,
    this.advancedSearchService.orderParam$,
    this.advancedSearchService.pageParams$,
    this.refreshObservable$
  ]).pipe(
    map((params) => {
      const [searchKeyword, sorting, pagination] = params;
      return buildAdvancedQueryParams({
        searchKeyword,
        sorting,
        pagination
      });
    }),
    switchMap((params) => {
      return this.api.getTemplates(params).pipe(
        tap((res) => {
          const { currentPage, totalPages, totalCount } = res.result;
          this.paginationService.setPagination(currentPage, totalCount, totalPages);
        })
      );
    }),
    map((res) => res.result.data)
  );

  goToCreateTemplaePage() {
    this.router.navigateByUrl('/template/add');
  }
}
