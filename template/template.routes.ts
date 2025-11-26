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
    path: '',
    pathMatch: 'full',
    redirectTo: ''
  }
];
