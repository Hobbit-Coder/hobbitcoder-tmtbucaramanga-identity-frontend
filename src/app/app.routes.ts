import { Routes } from '@angular/router';
import { authGuard, requireRoles, Role } from '@core/index';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layouts/classy-layout/classy-layout').then((m) => m.ClassyLayout),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/profile/profile.routes').then((m) => m.profileRoutes),
      },
      {
        path: 'users',
        ...requireRoles([Role.Admin, Role.Director]),
        loadChildren: () => import('./features/users/users.routes').then((m) => m.usersRoutes),
      },
    ],
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./shared/layouts/empty-layout/empty-layout').then((m) => m.EmptyLayout),
    children: [
      {
        path: '',
        loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
      },
    ],
  },
  {
    path: 'error',
    loadComponent: () =>
      import('./shared/layouts/empty-layout/empty-layout').then((m) => m.EmptyLayout),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./shared/pages/shared-pages.routes').then((m) => m.sharedPagesRoutes),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'error',
  },
];
