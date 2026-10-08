import { Routes } from '@angular/router';

export const sharedPagesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./error-page/error-page').then((m) => m.ErrorPage),
  },
  {
    path: 'not-found',
    loadComponent: () => import('./not-found-page/not-found-page').then((m) => m.NotFoundPage),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./unauthorized-page/unauthorized-page').then((m) => m.UnauthorizedPage),
  },
];
