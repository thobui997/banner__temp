import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  DeleteButtonComponent,
  EditButtonComponent,
  PageListWrapperComponent,
  PageTitleComponent
} from '@gsf/admin/app/shared/components';
import { AppTableComponent } from '@gsf/admin/app/shared/components/app-table/app-table.component';
import { PageLayoutComponent } from '@gsf/admin/app/shared/layouts';
import {
  AdvancedSearchService,
  ConfirmDialogService,
  PaginationService
} from '@gsf/admin/app/shared/services';
import { ButtonDirective, ICON_ADD_OUTLINE, IconSvgComponent, ToastService } from '@gsf/ui';
import { TemplateColumns } from '../../consts/template-colums';
import { combineLatest, EMPTY, map, switchMap, tap } from 'rxjs';
import { Destroyer } from '@gsf/admin/app/shared/base';
import { WithRefreshable } from '@gsf/admin/app/shared/mixins';
import { TemplateApiService } from '../../services/api/template-api.service';
import { buildAdvancedQueryParams } from '../../utils/build-advanced-query-params';
import {
  CellDefDirective,
  IsGrantedByPermissionsDirective
} from '@gsf/admin/app/shared/directives';
import { FilterField, RowEvent } from '@gsf/admin/app/shared/types';
import { ErrorMappingService } from '@gsf/admin/app/shared/services/error-mapping.service';
import { PermissionEnum } from '@gsf/admin/app/shared/enums/permission.enum';
import { TemplateResponse } from '../../types/template.type';
import { RatioEnum } from '../../enums/ratio.enum';
import { AssingedUserLookupService } from '@gsf/admin/app/shared/services/lookup-service/assigned-user.service';

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
    CellDefDirective,
    IsGrantedByPermissionsDirective
  ],
  providers: [AdvancedSearchService, PaginationService, TemplateApiService]
})
export class TemplateListComponent extends BaseComponent implements OnInit {
  private router = inject(Router);
  private advancedSearchService = inject(AdvancedSearchService);
  private paginationService = inject(PaginationService);
  private api = inject(TemplateApiService);
  private confirmDialogService = inject(ConfirmDialogService);
  private toastService = inject(ToastService);
  private errorMappingService = inject(ErrorMappingService);
  private assingedUserLookupService = inject(AssingedUserLookupService);

  ICON_ADD_OUTLINE = ICON_ADD_OUTLINE;

  tableColumns = TemplateColumns;

  currentDataLength = signal(0);

  PermissionEnum = PermissionEnum;

  filterConfiguration = computed<FilterField[]>(() => [
    {
      type: 'select',
      key: 'ratio',
      label: 'Ratio',
      placeholder: 'Select Ratio',
      options: [
        {
          name: '1:2',
          value: RatioEnum.Ratio1x2
        },
        {
          name: '16:9',
          value: RatioEnum.Ratio16x9
        }
      ],
      isMultipleSelect: false,
      showSearchBox: false
    },
    {
      type: 'select',
      key: 'createdBy',
      label: 'Created By',
      placeholder: 'Select User',
      options: this.assingedUserLookupService.assignedUsersOptions(),
      maxDisplayItem: 1,
      isMultipleSelect: true,
      showSearchBox: true
    },
    {
      type: 'date-range',
      key: 'createdOn',
      label: 'Created at',
      showFooter: false,
      fromPlaceholder: 'Select From',
      toPlaceholder: 'Select To'
    }
  ]);

  sourceList$ = combineLatest([
    this.advancedSearchService.searchTerm$,
    this.advancedSearchService.orderParam$,
    this.advancedSearchService.pageParams$,
    this.advancedSearchService.filters$,
    this.refreshObservable$
  ]).pipe(
    map((params) => {
      const [searchKeyword, sorting, pagination, allFilters] = params;
      return buildAdvancedQueryParams({
        searchKeyword,
        sorting,
        pagination,
        allFilters
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
    map((res) => res.result.data),
    tap((data) => {
      this.currentDataLength.set(data.length);
    })
  );

  ngOnInit(): void {
    this.assingedUserLookupService.fetchAssignedUsers().subscribe();
  }

  goToCreateTemplaePage() {
    this.router.navigateByUrl('/template/add');
  }

  goToEditTemplate(templateId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/template/edit', templateId], { queryParamsHandling: 'preserve' });
  }

  goToView(event: RowEvent<TemplateResponse>) {
    const { row } = event;

    this.router.navigate(['/template', row.id]);
  }

  deleteTemplate(id: number, event: Event) {
    event.stopPropagation();
    if (!id) return;

    this.confirmDialogService
      .openDeleteConfirmDialog('Delete Template?', 'Are you sure you want to delete this template?')
      .pipe(
        switchMap((data) => {
          if (!data) return EMPTY;
          return this.api.deleteTemplateById(id);
        })
      )
      .subscribe({
        next: () => {
          this.toastService.success({ message: 'Template deleted successfully' });

          this.paginationService.handlePostDeletionNavigation(this.currentDataLength(), () =>
            this.refresh()
          );
        },
        error: (err) => {
          this.errorMappingService.toToast(err);
        }
      });
  }
}
