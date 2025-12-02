import { Route } from '@angular/router';
import { hasUnsavedChangeGuard, routeGuard } from '../../shared/guards';
import { PermissionEnum } from '../../shared/enums/permission.enum';

export const TEMPLATE_Routes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/template-list/template-list.component').then((m) => m.TemplateListComponent),
    canActivate: [routeGuard([PermissionEnum['Template.View']])]
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./pages/template-add/template-add.component').then((m) => m.TemplateAddComponent),
    canDeactivate: [hasUnsavedChangeGuard],
    canActivate: [routeGuard([PermissionEnum['Template.Create']])]
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/template-edit/template-edit.component').then((m) => m.TemplateEditComponent),
    canDeactivate: [hasUnsavedChangeGuard],
    canActivate: [routeGuard([PermissionEnum['Template.Edit']])]
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/template-view-detail/template-view.component').then(
        (m) => m.TemplateViewComponent
      ),
    canActivate: [routeGuard([PermissionEnum['Template.View']])]
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ''
  }
];
