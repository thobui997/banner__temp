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
    path: '',
    pathMatch: 'full',
    redirectTo: ''
  }
];
