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
    title: 'Iniciar sesión | Identity',
  },
  {
    path: 'sign-up',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./pages/sign-up-page/sign-up-page').then((m) => m.SignUpPage),
    title: 'Crear una cuenta | Identity',
  },
  {
    path: 'authorize',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/authorize-page/authorize-page').then((m) => m.AuthorizePage),
    title: 'Volviendo a la aplicación | Identity',
  },
];
