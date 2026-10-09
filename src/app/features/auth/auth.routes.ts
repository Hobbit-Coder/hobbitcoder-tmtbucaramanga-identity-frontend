import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from '@core/index';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'sign-in',
    pathMatch: 'full',
  },
  {
    path: 'sign-in',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./pages/sign-in-page/sign-in-page').then((m) => m.SignInPage),
    title: 'Ingresar | TMT',
  },
  {
    path: 'first-access',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./pages/first-access-page/first-access-page').then((m) => m.FirstAccessPage),
    title: 'Activa tu cuenta | TMT',
  },
  {
    path: 'recover',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./pages/recover-page/recover-page').then((m) => m.RecoverPage),
    title: 'Recuperar acceso | TMT',
  },
  {
    path: 'authorize',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/authorize-page/authorize-page').then((m) => m.AuthorizePage),
    title: 'Volviendo a la aplicación | TMT',
  },
];
