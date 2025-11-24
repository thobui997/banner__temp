import { Route } from '@angular/router';

export const TEMPLATE_Routes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/template-list/template-list.component').then((m) => m.TemplateListComponent)
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./pages/template-add/template-add.component').then((m) => m.TemplateAddComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/template-edit/template-edit.component').then((m) => m.TemplateEditComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ''
  }
];
